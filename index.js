const banner = document.querySelector('#banner');
const bannerText = document.querySelector('#bannerText');
const closeBannerBtn = document.querySelector('#closeBannerBtn');
const showNomineesBtn = document.querySelector('#showNominees');
const hideNomineesBtn = document.querySelector('#hideNominees');

const form = document.querySelector('form');
const searchTerm = document.querySelector('#movie');
const movieInfo = document.querySelector('#movieInfo');
const nomineeInfo = document.querySelector('#nomineeInfo');

const movieList = document.querySelector('#movieList');
const nomineeList = document.querySelector('#nomineeList');
const nomineesContainer = document.querySelector('.nominees-container');

let nominees = JSON.parse(localStorage.getItem('awardNominees')) || [];
let bannerTimeout;

/**
 * Shows a banner with specified text and color for a given timeout
 * @param {string} text - text to display in banner
 * @param {string} color - backgroundColor of the banner
 * @param {number} timeout - timeout in milliseconds before banner clears
 */
const showBanner = (
  text = bannerText.innerText,
  color = '#4ac774',
  timeout = 10000
) => {
  banner.style.backgroundColor = color;
  bannerText.innerText = text;

  if (typeof +timeout === 'number' && !isNaN(+timeout)) {
    bannerTimeout = setTimeout(() => {
      banner.classList.remove('banner--shown');
    }, +timeout);
  }

  banner.classList.add('banner--shown');
};

/**
 * Hides the Banner before the timout elapses
 */
const hideBanner = () => {
  clearTimeout(bannerTimeout);

  banner.classList.remove('banner--shown');
};

/**
 * Updates number of nominees left
 */
const updateNomineesLeft = (filledFromLocalStorage = false) => {
  if (nominees.length) {
    nomineeInfo.classList.remove('empty');
    nomineeInfo.innerText = `You have ${5 - nominees.length} nominee${
      5 - nominees.length !== 1 ? 's' : ''
    } left.`;

    if (nominees.length === 5) {
      filledFromLocalStorage
        ? showBanner('Previous Nominations Loaded. Thank You!')
        : showBanner('You have selected five movies. Thank you!');
    }
  } else {
    nomineeInfo.classList.add('empty');
    nomineeInfo.innerText = 'Oops! :( There are no nominees yet.';
  }
};

/**
 * Fills the nominees list from local storage (if available)
 */
const fillNomineeList = () => {
  let html = ``;
  updateNomineesLeft(true);

  nominees.forEach((movie) => {
    const { title, imdbId, year, imgSrc } = movie;

    html += `
    <li class="movie" data-title="${title}" data-year="${year}" data-imdb-id="${imdbId}" >
    ${imgSrc ? `<img src="${imgSrc}" alt="${title}"  />` : ''}
    <div class="movie__details">
      <h3>${title}</h3>
      <p>${year}</p>
      <button onclick="withdrawNomination(this)" class="remove">Remove</button>
    </div>
  </li>
    `;
  });

  nomineeList.innerHTML = html;
};
fillNomineeList();

/**
 * Adds a movie to nominee list
 * @param {HTMLButtonElement} e - the clicked button
 */
const nominate = (e) => {
  if (nominees.length >= 5) {
    return showBanner('You can only nominate five movies.', 'red');
  }

  const movie = e.closest('.movie');
  const { title, imdbId, year } = movie.dataset;
  const imgSrc = movie.querySelector('img')
    ? movie.querySelector('img').src
    : '';

  // if movie isn't already nominated, proceed
  if (nominees.filter((nominee) => nominee.imdbId === imdbId).length === 0) {
    nominees.push({ title, imdbId, year, imgSrc });
    localStorage.setItem('awardNominees', JSON.stringify(nominees));

    let clone = movie.cloneNode(true);
    let button = clone.querySelector('button');
    button.innerText = 'Remove';
    button.classList.add('remove');

    button.setAttribute('onclick', 'withdrawNomination(this)');

    nomineeList.appendChild(clone);
    e.innerText = 'Nominated';
    e.disabled = true;
  }

  if (!nominees.length) nomineeInfo.classList.add('empty');
  updateNomineesLeft();
};

/**
 * Removes a movie from nominees' list
 * @param {HTMLButtonElement} e
 */
const withdrawNomination = (e) => {
  hideBanner();
  const movie = e.closest('.movie');
  const { imdbId } = movie.dataset;

  nominees = nominees.filter((nominee) => nominee.imdbId !== imdbId);

  localStorage.setItem('awardNominees', JSON.stringify(nominees));

  movie.classList.add('remove');

  setTimeout(() => nomineeList.removeChild(movie), 300);
  // enable button in results
  let movieButton = movieList.querySelector(
    `.movie[data-imdb-id="${imdbId}"] button`
  );

  if (movieButton) {
    movieButton.disabled = false;
    movieButton.innerText = 'Nominate';
  }
  updateNomineesLeft();
};

/**
 * Checks if movie is nominated
 * @param {string} movieId - movieId to check nomination status
 * @returns {boolean} - movie's nomination status
 */
const checkIfNominated = (movieId) => {
  return nominees.filter((movie) => movie.imdbId === movieId).length === 1;
};

/**
 * Fetches search results from API and fills the DOM with the movies
 */
const getMovies = async () => {
  const url = `https://www.omdbapi.com/?apikey=afff5766&s=${encodeURIComponent(
    searchTerm.value.trim()
  )}`;

  if (!searchTerm.value.trim()) return;

  try {
    const res = await fetch(url);
    const data = await res.json();

    let moviesHtml = '';

    if (data.Search && data.Search.length) {
      data.Search.forEach((movie) => {
        const { Title, Year, imdbID, Poster } = movie;
        moviesHtml += `
      <li class="movie" data-title="${Title}" data-year="${Year}" data-imdb-id="${imdbID}">
      ${Poster !== 'N/A' ? `<img src="${Poster}" alt="${Title}"/>` : ''}    
      <div class="movie__details">
        <h3>${Title}</h3>
        <p>${Year}</p>
        <button onclick="nominate(this)" ${
          checkIfNominated(imdbID) ? 'disabled' : ''
        }>${checkIfNominated(imdbID) ? 'Nominated' : 'Nominate'}</button>
      </div>
    </li>
      `;
      });

      movieInfo.innerText = `Showing results for "${searchTerm.value.trim()}".`;
      movieInfo.classList.remove('empty');
      movieList.innerHTML = moviesHtml;
    } else {
      movieInfo.classList.add('empty');
      movieList.innerHTML = '';
      movieInfo.innerText = `No results for "${searchTerm.value.trim()}" found`;
    }
  } catch (error) {
    console.error(error);
  }
};

// event listeners
closeBannerBtn.addEventListener('click', (e) => {
  banner.classList.remove('banner--shown');
  clearTimeout(bannerTimeout);
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  getMovies();
});

showNomineesBtn.addEventListener('click', (e) => {
  nomineesContainer.classList.add('show');
});

hideNomineesBtn.addEventListener('click', (e) => {
  nomineesContainer.classList.remove('show');
});

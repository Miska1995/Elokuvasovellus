// OMDB API-avain
const omdbApiKey = '6c2c6b48';

// Funktio taustakuvan vaihtamiseen, tässä koodin ainoa osuus jossa on käytetty suomenkieltä itse funktiossa
const taustakuvat = ['images/grungetausta.jpg', 'images/retrotausta.gif'];
let nykyinenTaustakuva = 0;

function vaihdaTaustakuva() {
    nykyinenTaustakuva = (nykyinenTaustakuva + 1) % taustakuvat.length;
    document.body.style.backgroundImage = "url('" + taustakuvat[nykyinenTaustakuva] + "')";
}

// Funktio taustamusiikille ja äänenvoimakkuuden säätimen näkyvyyden hallintaan
function toggleMusic() {
    const music = document.getElementById("background-music");
    const volumeSlider = document.getElementById("volume-slider-container");
    const musicButton = document.getElementById("music-toggle-button");
    
    if (music.paused) {
        music.play();
        volumeSlider.style.display = 'block'; // Näytä säädin kun musiikki toi
        musicButton.style.backgroundColor = '#39FF14'; // Nappi muuttuu vihreäksi kun musiikki soi
    } else {
        music.pause();
        volumeSlider.style.display = 'none'; // Piilota säädin kun musiikki ei soi
        musicButton.style.backgroundColor = ''; // Palauta napin alkuperäinen väri kun musiikki ei soi
    }
}

// Funktio äänenvoimakkuuden säätämiseen
function setVolume(value) {
    const music = document.getElementById("background-music");
    music.volume = value;
}

// Funktio äänenvoimakkuuden säätimen alustamiseen
window.onload = function() {
    var volumeSlider = document.getElementById("volume-slider");
    volumeSlider.min = "0";
    volumeSlider.max = "1";
    volumeSlider.step = "0.01";
    volumeSlider.value = "0.5";

    // Asetetaan tapahtumankäsittelijä muutoksille
    volumeSlider.onchange = function() {
        setVolume(this.value);
    };
}

// Funktio live-kellolle
const clockElement = document.getElementById('live-clock');

const updateClock = () => {
    const now = new Date();
    let hours = now.getUTCHours() + 2; // Suomen aika on UTC+2 tai UTC+3 riippuen vuodenajasta.
    let minutes = now.getUTCMinutes();
    let seconds = now.getUTCSeconds();

    const timeString = `${hours}:${minutes}:${seconds}`;
    clockElement.textContent = timeString;
};

setInterval(updateClock, 1000); // Päivittää kelloa joka sekuntti

// Funktio teatterivalikon näyttämiseen
function populateTheaters() {
    fetch('https://www.finnkino.fi/xml/TheatreAreas/')
    .then(response => response.text())
    .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
    .then(data => {
        const theaters = Array.from(data.querySelectorAll('TheatreArea'));
        // Lajittele teatterit aakkosjärjestyksessä
        theaters.sort((a, b) => a.querySelector('Name').textContent.localeCompare(b.querySelector('Name').textContent));

        const dropdown = document.getElementById('theater-dropdown');
        dropdown.innerHTML = '<option>Valitse teatteri</option>'; // Menun Oletusvalinta
        theaters.forEach(theater => {
            const option = document.createElement('option');
            option.value = theater.querySelector('ID').textContent;
            option.textContent = theater.querySelector('Name').textContent;
            dropdown.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Virhe haettaessa teattereita:', error);
        // Näytä käyttäjäystävällinen virheilmoitus
        document.getElementById('theater-dropdown').innerHTML = '<option>Teattereiden lataus epäonnistui</option>';
    });
}

// Funktio elokuvien hakemiseen ja näyttämiseen
function fetchMovies(theaterId) {
    // Nykyinen päivämäärä
    const today = new Date();

    // Muotoillaan päivämäärä Finnkinon API:n vaatimukseen sopivaksi
    // Poistetaan aikaosa ja muotoillaan se oikeaan muotoon (vvvv-kk-pp)
    const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    // Rakennetaan URL-osoite nykyiselle päivämäärälle
    const url = `https://www.finnkino.fi/xml/Schedule/?area=${theaterId}&dt=${formattedDate}`;

    fetch(url)
        .then(response => response.text())
        .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
        .then(data => {
            const shows = data.querySelectorAll('Show');
            const movies = [];
            shows.forEach(show => {
                // Haetaan jokaisen näytöksen tiedot
                const title = show.querySelector('Title').textContent;
                const originalTitle = show.querySelector('OriginalTitle').textContent;
                const showTime = show.querySelector('dttmShowStart').textContent;
                // Lisätään elokuva tietoineen listaan
                movies.push({ title, originalTitle, showTime });
            });

            // Tyhjennetään olemassa olevat elokuvatiedot
            const moviesContainer = document.getElementById('movies-container');
            moviesContainer.innerHTML = '';

            // Käydään läpi kaikki löydetyt elokuvat ja haetaan niiden tiedot
            movies.forEach(movie => {
                // Tässä esimerkissä käytetään elokuvan alkuperäistä nimeä OMDB API -kutsussa
                fetchMovieInfo(movie.originalTitle, moviesContainer, movie.showTime);
            });
        })
        .catch(error => console.error('Virhe haettaessa elokuvia:', error));
}


// Funktio elokuvatiedon hakemiseen OMDB:stä, kieliasetuksena on Suomi.
function fetchMovieInfo(title, container, showTime) {
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&language=fi&apikey=${omdbApiKey}`;
    fetch(url)
    .then(response => response.json())
    .then(movieInfo => {
        if (movieInfo.Response === "True") {
            displayMovieInfo(movieInfo, container, showTime);
        }
    })
    .catch(error => console.error('Virhe haettaessa elokuvan tietoja:', error));
}

// Näytösajan funktio
function displayMovieInfo(movieInfo, container, showTime) {
    const showTimeFormatted = new Date(showTime).toLocaleString('fi-FI', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    // Elokuvakortissa näkyvät tiedot. 'backtick' käytössä!
    const movieElement = document.createElement('div');
    movieElement.className = 'movie';
    movieElement.innerHTML = `
        <img src="${movieInfo.Poster}" alt="${movieInfo.Title} juliste">
        <h3>${movieInfo.Title}</h3>
        <p>Näytösaika: ${showTimeFormatted}</p>
        <p>Genre: ${movieInfo.Genre}</p>
        <p>Ohjaaja: ${movieInfo.Director}</p>
        <p>Näyttelijät: ${movieInfo.Actors}</p>
        <p>Kesto: ${movieInfo.Runtime}</p>
        <p>Ikäraja: ${movieInfo.Rated}</p>
        <details>
            <summary>Juoni (Lue klikkaamalla)</summary>
            <p>${movieInfo.Plot}</p>
        </details>
        <button class="add-to-wishlist-button" data-added="false">Lisää toivelistaan</button>
    `;
    container.appendChild(movieElement);

    // Lisää tapahtumankuuntelija juuri luodulle painikkeelle
    const wishlistButton = movieElement.querySelector('.add-to-wishlist-button');
    wishlistButton.addEventListener('click', handleWishlistButtonClick);
}

// Toivelistan painikkeiden yhteinen tapahtumankäsittelijä
function handleWishlistButtonClick() {
    const button = this;
    const isAdded = button.getAttribute('data-added') === 'true';

    if (isAdded) {
        button.setAttribute('data-added', 'false');
        button.classList.remove('added-to-wishlist');
        alert('Poistettu toivelistalta');
    } else {
        button.setAttribute('data-added', 'true');
        button.classList.add('added-to-wishlist');
        alert('Lisätty toivelistalle');
    }
}

// Lisää tapahtumankäsittelijä kaikille toivelistan painikkeille
const wishlistButtons = document.querySelectorAll('.add-to-wishlist-button');
wishlistButtons.forEach(button => {
    button.addEventListener('click', handleWishlistButtonClick);
});


// Funktio elokuvien suodattamiseen
function filterMovies() {
    const searchValue = document.getElementById('search-input').value.toLowerCase();
    const movies = document.querySelectorAll('.movie');
    movies.forEach(movie => {
        const title = movie.querySelector('h3').textContent.toLowerCase();
        if (title.includes(searchValue)) {
            movie.style.display = '';
        } else {
            movie.style.display = 'none';
        }
    });
}

// Alusta teatterivalikko sivun latautuessa
document.addEventListener('DOMContentLoaded', populateTheaters);

// Kuuntelija teatterivalikon muutoksille
document.getElementById('theater-dropdown').addEventListener('change', function() {
    const theaterId = this.value;
    if (theaterId) {
        fetchMovies(theaterId);
    }
});

// Kuuntelija hakukentän syötteelle
document.getElementById('search-input').addEventListener('input', filterMovies);

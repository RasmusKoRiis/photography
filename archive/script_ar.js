const photos = document.querySelectorAll('.photo');
const body = document.body;
const photoGrid = document.querySelector('.photo-grid');

// Lazy loading function
const lazyLoad = (entries, observer) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.getAttribute('data-src'); // Get the actual image source
            if (src) {
                img.src = src; // Load the image
                img.removeAttribute('data-src'); // Remove the placeholder
            }
            observer.unobserve(img); // Stop observing once loaded
        }
    });
};

// Set up an IntersectionObserver for lazy loading
const lazyObserver = new IntersectionObserver(lazyLoad, {
    root: null, // Use the viewport as the root
    rootMargin: "100px", // Preload images slightly before they come into view
    threshold: 0.1, // Load when at least 10% of the image is visible
});

// Function to ensure the grid is filled with all photos
const fillGrid = () => {
    const photoCount = photos.length;

    // Clone photos to append them repeatedly, creating a scrollable grid
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < photoCount * 3; i++) { // Repeat photos 3 times
        const clone = photos[i % photoCount].cloneNode(true);
        clone.setAttribute('data-src', clone.src); // Use data-src for lazy loading
        clone.src = ''; // Initially empty to delay loading
        lazyObserver.observe(clone); // Observe the clone for lazy loading
        fragment.appendChild(clone);
    }
    photoGrid.appendChild(fragment);

    // Rebind click events for all photos in the grid
    const allPhotos = document.querySelectorAll('.photo');
    allPhotos.forEach((photo, index) => {
        photo.removeEventListener('click', handlePhotoClick); // Avoid duplicate listeners
        photo.addEventListener('click', () => createFullscreenView(index % photoCount));
    });
};

// Function to handle photo clicks
const handlePhotoClick = (index) => createFullscreenView(index);

// Fullscreen view function
const createFullscreenView = (startIndex) => {
    const container = document.createElement('div');
    container.classList.add('fullscreen-container');

    Array.from(photos).forEach((photo, index) => {
        const imgContainer = document.createElement('div');
        imgContainer.style.position = "relative";

        const img = document.createElement('img');
        img.src = photo.src;
        img.alt = photo.alt;
        img.classList.add('fullscreen-img');

        // Info icon
        const infoIcon = document.createElement('div');
        infoIcon.classList.add('info-icon');
        infoIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            const overlay = imgContainer.querySelector('.info-overlay');
            overlay.classList.toggle('visible');
        });

        // Aspect ratio button
        const aspectIcon = document.createElement('div');
        aspectIcon.classList.add('aspect-icon');
        aspectIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            const overlay = imgContainer.querySelector('.aspect-overlay');
            overlay.classList.add('visible');
        });

        // Info overlay
        const infoOverlay = document.createElement('div');
        infoOverlay.classList.add('info-overlay');
        infoOverlay.innerText = `Description for ${photo.alt}`;

        infoOverlay.addEventListener('click', (e) => {
            e.stopPropagation();
            infoOverlay.classList.remove('visible');
        });

        // Aspect ratio overlay
        const aspectOverlay = document.createElement('div');
        aspectOverlay.classList.add('aspect-overlay');
        const aspectImg = document.createElement('img');
        aspectImg.src = photo.src;
        aspectOverlay.appendChild(aspectImg);

        aspectOverlay.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent closing when clicking the image
            aspectOverlay.classList.remove('visible'); // Close the overlay
        });

        // Close the aspect ratio view and resume the scroll page
        container.addEventListener('click', (e) => {
            if (!e.target.classList.contains('aspect-overlay') && !e.target.classList.contains('aspect-icon')) {
                returnToGridPage(); // Return to grid if outside aspect view
            }
        });

        imgContainer.appendChild(img);
        imgContainer.appendChild(infoIcon);
        imgContainer.appendChild(aspectIcon);
        imgContainer.appendChild(infoOverlay);
        imgContainer.appendChild(aspectOverlay);
        container.appendChild(imgContainer);
    });

    body.innerHTML = '';
    body.appendChild(container);

    const selectedPhoto = container.children[startIndex];
    selectedPhoto.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// Function to return to the grid page
const returnToGridPage = () => {
    body.innerHTML = ''; // Clear fullscreen container
    body.appendChild(photoGrid); // Restore the grid
};

// Fill the grid with scrollable content on page load
fillGrid();
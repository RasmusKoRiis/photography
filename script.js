let photosData = []; // Global array to store photo data from JSON
const body = document.body;
const photoGrid = document.querySelector('.photo-grid');
let lastViewedIndex = 0; // Store the index of the last viewed photo

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
    root: null,
    rootMargin: "100px",
    threshold: 0.1,
});

// Fetch photos from JSON
const fetchPhotos = async () => {
    try {
        const response = await fetch('photos.json'); // Path to JSON file
        photosData = await response.json(); // Store photo data
        initializeGrid(); // Populate the grid for the first time
        observeScrollTrigger(); // Set up infinite scrolling
    } catch (error) {
        console.error("Error fetching photo data:", error);
    }
};

// Initialize the grid for the first time
const initializeGrid = () => {
    fillGrid(); // Fill the grid with the first batch of photos
    rebindPhotoClickEvents(); // Bind click events for fullscreen functionality
};

// Fill the grid with photos
const fillGrid = () => {
    const fragment = document.createDocumentFragment();

    photosData.forEach((photo, index) => {
        if (!photo.src) return; // Skip if photo data is incomplete

        // Create photo container
        const container = document.createElement('div');
        container.classList.add('photo-container');

        // Create the photo element
        const img = document.createElement('img');
        img.setAttribute('data-src', photo.src); // Lazy-load the image
        img.alt = photo.alt;
        img.classList.add('photo');
        img.addEventListener('error', () => {
            console.error(`Failed to load image: ${photo.src}`);
            container.remove(); // Remove the container if image fails to load
        });

        lazyObserver.observe(img); // Observe for lazy loading

        // Create hover overlay
        const overlay = document.createElement('div');
        overlay.classList.add('photo-hover-overlay');
        overlay.innerText = photo.alt; // Use the alt text as overlay text

        // Append photo and overlay to the container
        container.appendChild(img);
        container.appendChild(overlay);
        fragment.appendChild(container);
    });

    // Append the fragment to the photo grid
    photoGrid.appendChild(fragment);
};

// Rebind click events for all photos
const rebindPhotoClickEvents = () => {
    const allPhotos = document.querySelectorAll('.photo');
    allPhotos.forEach((photo, index) => {
        photo.addEventListener('click', () => createFullscreenView(index % photosData.length));
    });
};

// Fullscreen view with I and A buttons and updated info overlay
const createFullscreenView = (startIndex) => {
    lastViewedIndex = startIndex; // Save the index of the photo being viewed
    const container = document.createElement('div');
    container.classList.add('fullscreen-container');

    photosData.forEach((photo, index) => {
        // Create image container
        const imgContainer = document.createElement('div');
        imgContainer.style.position = 'relative';

        // Create the image
        const img = document.createElement('img');
        img.src = photo.src;
        img.alt = photo.alt;
        img.classList.add('fullscreen-img');

        // Info button
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

        // Info overlay (structured with title and description)
        const infoOverlay = document.createElement('div');
        infoOverlay.classList.add('info-overlay');

        const title = document.createElement('h3');
        title.classList.add('info-title');
        title.innerText = photo.alt; // Use the photo's alt text as the title
        infoOverlay.appendChild(title);

        if (Array.isArray(photo.description)) {
            photo.description.forEach((paragraph) => {
                const descriptionParagraph = document.createElement('p');
                descriptionParagraph.classList.add('info-description');
                descriptionParagraph.innerText = paragraph;
                infoOverlay.appendChild(descriptionParagraph);
            });
        } else {
            const description = document.createElement('p');
            description.classList.add('info-description');
            description.innerText = photo.description || "No additional information available.";
            infoOverlay.appendChild(description);
        }

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
            e.stopPropagation();
            aspectOverlay.classList.remove('visible');
        });

        // Close fullscreen view on outside click
        container.addEventListener('click', (e) => {
            if (!e.target.classList.contains('aspect-overlay') && !e.target.classList.contains('aspect-icon')) {
                returnToGridPage();
            }
        });

        // Append elements to the image container
        imgContainer.appendChild(img);
        imgContainer.appendChild(infoIcon);
        imgContainer.appendChild(aspectIcon);
        imgContainer.appendChild(infoOverlay);
        imgContainer.appendChild(aspectOverlay);
        container.appendChild(imgContainer);
    });

    body.innerHTML = ''; // Clear existing content
    body.appendChild(container); // Append fullscreen container

    const selectedPhoto = container.children[startIndex];
    selectedPhoto.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// Return to the grid page function
const returnToGridPage = () => {
    body.innerHTML = ''; // Clear fullscreen content
    body.appendChild(photoGrid); // Restore the grid
    observeScrollTrigger(); // Re-setup scroll trigger

    // Scroll to the last viewed photo
    const gridPhotos = document.querySelectorAll('.photo-container');
    if (gridPhotos[lastViewedIndex]) {
        gridPhotos[lastViewedIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

// Infinite scrolling: Observe when to load more photos
const observeScrollTrigger = () => {
    const trigger = document.createElement('div');
    trigger.classList.add('scroll-trigger');
    photoGrid.appendChild(trigger);

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                fillGrid(); // Add more photos to the grid
                rebindPhotoClickEvents(); // Rebind click events for new photos
            }
        });
    }, { root: null, rootMargin: "100px", threshold: 0 });

    scrollObserver.observe(trigger);
};

// Ensure the mailto link is clickable
document.querySelector('.name-link').addEventListener('click', (e) => {
    console.log('Name clicked!');
});

// Default grid columns
let gridColumns = 3;

// Add event listeners for the + and - buttons
document.getElementById('increase-grid').addEventListener('click', () => {
    gridColumns = 3; // Set to 3 columns
    updateGridColumns();
});

document.getElementById('decrease-grid').addEventListener('click', () => {
    gridColumns = 5; // Set to 5 columns
    updateGridColumns();
});

// Function to update the grid style dynamically
const updateGridColumns = () => {
    document.querySelector('.photo-grid').style.gridTemplateColumns = `repeat(${gridColumns}, 1fr)`;
};


// Fetch photos and initialize the grid
fetchPhotos();
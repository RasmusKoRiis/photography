document.addEventListener('DOMContentLoaded', () => {
    let photosData = []; // Global array to store photo data from JSON
    const photoGrid = document.querySelector('.photo-grid');
    let gridColumns = 3; // Default grid columns
    let lastViewedIndex = 0; // Store the index of the last viewed photo
    const photosPerBatch = 20; // Number of photos to load per batch
    let loadedPhotoCount = 0; // Track how many photos have been loaded

    // Fetch photos from JSON
    const fetchPhotos = async () => {
        try {
            const response = await fetch('photos.json'); // Path to JSON file
            photosData = await response.json(); // Store photo data
            initializeGrid(); // Populate the grid for the first time
        } catch (error) {
            console.error("Error fetching photo data:", error);
        }
    };

    // Initialize the grid for the first time
    const initializeGrid = () => {

        // Sort photosData by id in descending order
        photosData.sort((a, b) => b.id - a.id);
        
        const fragment = document.createDocumentFragment();

        photosData.forEach((photo, index) => {
            if (!photo.src) return; // Skip if photo data is incomplete

            // Create photo container
            const container = document.createElement('div');
            container.classList.add('photo-container');
            container.setAttribute('data-id', index);

            // Create the photo element
            const img = document.createElement('img');
            img.src = photo.src; // Load the image immediately
            img.alt = photo.alt;
            img.classList.add('photo');
            img.addEventListener('error', () => {
                console.error(`Failed to load image: ${photo.src}`);
                container.remove(); // Remove the container if image fails to load
            });

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

        // Bind click events for fullscreen functionality
        rebindPhotoClickEvents();
    };

    // Rebind click events for all photos
    const rebindPhotoClickEvents = () => {
        const allPhotos = document.querySelectorAll('.photo');
        allPhotos.forEach((photo) => {
            photo.addEventListener('click', (event) => {
                const container = event.target.closest('.photo-container');
                const photoIndex = container.getAttribute('data-id'); // Fetch the correct index
                if (photoIndex !== null) {
                    createFullscreenView(parseInt(photoIndex, 10)); // Use the correct index
                } else {
                    console.error("Photo index not found!");
                }
            });
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

        document.querySelector('.photo-grid').style.display = 'none'; // Hide the grid
        document.querySelector('.grid-controls').style.display = 'none'; // Hide controls
        document.querySelector('.name-overlay').style.visibility = 'hidden'; // Hide name overlay
        document.body.appendChild(container); // Append fullscreen container

        const selectedPhoto = container.children[startIndex];
        selectedPhoto.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const returnToGridPage = () => {
        const fullscreenContainer = document.querySelector('.fullscreen-container');
        if (fullscreenContainer) fullscreenContainer.remove(); // Remove fullscreen container
    
        const photoGrid = document.querySelector('.photo-grid');
        if (!photoGrid) {
            console.error("Photo grid element not found!");
            return; // Abort if the photo grid is missing
        }
    
        // Restore visibility of controls and overlay
        document.querySelector('.grid-controls').style.display = 'flex'; // Show grid controls
        document.querySelector('.name-overlay').style.visibility = 'visible'; // Show name overlay
    
        // Ensure the photo grid is visible
        photoGrid.style.display = 'grid';
    
        // Clear the grid and prepare for progressive loading
        photoGrid.innerHTML = ""; // Clear the grid content
        loadedPhotoCount = 0; // Reset loaded photo count
    
        const fragment = document.createDocumentFragment();
    
        // Load an initial batch of photos (e.g., first 20)
        const start = loadedPhotoCount;
        const end = Math.min(loadedPhotoCount + photosPerBatch, photosData.length);
    
        for (let i = start; i < end; i++) {
            const photo = photosData[i];
    
            if (!photo.src) return; // Skip if photo data is incomplete
    
            // Create photo container
            const container = document.createElement('div');
            container.classList.add('photo-container');
            container.setAttribute('data-id', i); // Attach data-id for correct indexing
    
            // Create the photo element
            const img = document.createElement('img');
            img.setAttribute('src', photo.src); // Load the image immediately
            img.alt = photo.alt;
            img.classList.add('photo');
    
            const overlay = document.createElement('div');
            overlay.classList.add('photo-hover-overlay');
            overlay.innerText = photo.alt;
    
            container.appendChild(img);
            container.appendChild(overlay);
            fragment.appendChild(container);
        }
    
        loadedPhotoCount = end; // Update the count of loaded photos
    
        // Append the initial batch to the photo grid
        photoGrid.appendChild(fragment);
    
        // Rebind click events for fullscreen functionality
        rebindPhotoClickEvents();
    
        // Set up infinite scrolling for additional photos
        observeScrollTrigger();
    };

    // Update grid columns dynamically
    const updateGridColumns = () => {
        document.querySelector('.photo-grid').style.gridTemplateColumns = `repeat(${gridColumns}, 1fr)`;
    };

    // Add event listeners for the + and - buttons
    document.getElementById('increase-grid').addEventListener('click', () => {
        gridColumns = Math.max(1, gridColumns - 1); // Decrease columns (increase grid size)
        updateGridColumns();
    });

    document.getElementById('decrease-grid').addEventListener('click', () => {
        gridColumns += 1; // Increase columns (reduce grid size)
        updateGridColumns();
    });

    // Shuffle the photo grid
    const shuffleGrid = () => {
        const photoContainers = Array.from(photoGrid.querySelectorAll('.photo-container'));

        // Shuffle the array of photo containers
        const shuffled = photoContainers.sort(() => Math.random() - 0.5);

        // Clear and re-append photo containers in shuffled order
        photoGrid.innerHTML = ""; // Clear the grid
        shuffled.forEach(container => {
            photoGrid.appendChild(container);
        });

        rebindPhotoClickEvents(); // Rebind events after shuffle
    };

    // Force grid reflow for better rendering
    const forceGridReflow = () => {
        photoGrid.style.display = 'none'; // Hide grid
        requestAnimationFrame(() => {
            photoGrid.style.display = 'grid'; // Redisplay grid
        });
    };

    // Integrate with shuffle
    document.getElementById('shuffle-grid').addEventListener('click', () => {
        shuffleGrid();
        forceGridReflow();
    });

    const loadMorePhotos = () => {
        const fragment = document.createDocumentFragment();
    
        const start = loadedPhotoCount;
        const end = Math.min(loadedPhotoCount + photosPerBatch, photosData.length);
    
        for (let i = start; i < end; i++) {
            const photo = photosData[i];
    
            // Create photo container
            const container = document.createElement('div');
            container.classList.add('photo-container');
            container.setAttribute('data-id', i); // Attach data-id for correct indexing
    
            // Create the photo element
            const img = document.createElement('img');
            img.setAttribute('src', photo.src); // Load the image immediately
            img.alt = photo.alt;
            img.classList.add('photo');
    
            const overlay = document.createElement('div');
            overlay.classList.add('photo-hover-overlay');
            overlay.innerText = photo.alt;
    
            container.appendChild(img);
            container.appendChild(overlay);
            fragment.appendChild(container);
        }
    
        loadedPhotoCount = end; // Update the count of loaded photos
        photoGrid.appendChild(fragment); // Append the batch to the grid
    
        rebindPhotoClickEvents(); // Bind click events for newly added photos
    
        // If all photos are loaded, remove the scroll trigger
        if (loadedPhotoCount >= photosData.length) {
            const trigger = document.querySelector('.scroll-trigger');
            if (trigger) trigger.remove();
        }
    };

    const observeScrollTrigger = () => {
        const trigger = document.createElement('div');
        trigger.classList.add('scroll-trigger');
        photoGrid.appendChild(trigger);
    
        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    loadMorePhotos(); // Add more photos to the grid
                }
            });
        }, { root: null, rootMargin: "100px", threshold: 0 });
    
        scrollObserver.observe(trigger);
    };

    // Fetch photos and initialize the grid
    fetchPhotos().then(() => {
        // Use progressive loading by default
        loadMorePhotos();
        observeScrollTrigger();
    
        // If you want to load all photos at once, you can call initializeGrid instead:
        // initializeGrid();
    });
});
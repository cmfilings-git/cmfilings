// Function to unhide the Header and Mobile Nav
function showNavigation() {
    const header = document.getElementById('main-header');
    const bottomNav = document.getElementById('mobile-bottom-nav');

    if (header) {
        header.classList.remove('hidden');
        header.classList.add('flex'); // Restores flexbox layout for the header
    }
    if (bottomNav) {
        bottomNav.classList.remove('hidden');
        bottomNav.classList.add('flex'); // Restores flexbox layout for bottom nav
    }
}

// Example usage: Place inside your File Upload logic.
// If you are using this inside gstr.html (the Excel parser):
function processExcelFile() {
    // ... your existing validation logic ...

    reader.onload = function(e) {
        try {
            // ... your existing workbook parsing logic ...

            if (processedCount > 0) {
                alert(`Success! Extracted data from ${processedCount} sheets.`);
                
                // UNHIDE NAVIGATION ON SUCCESSFUL UPLOAD
                showNavigation(); 

            } else {
                alert(`Extracted 0 records. Ensure your headers match the GST format.`);
            }
        } catch (error) {
            console.error(error);
            alert("Error reading Excel. Please ensure it's a valid template.");
        }
    };
    reader.readAsArrayBuffer(fileInput.files);
}

// Example usage: If pasting manually
function processPastedSection() {
    // ... your existing parsing logic ...
    try {
        parseSectionData(section, rows, userStateCode);
        renderSummaryCards();
        
        let newCount = calculateAggregates()[trackingKey]?.count || 0;
        
        if (newCount > prevCount) {
            alert(`${section.toUpperCase()} section added to memory successfully!`);
            
            // UNHIDE NAVIGATION ON SUCCESSFUL PASTE
            showNavigation(); 
            
        } else {
            alert(`0 records added!`);
        }
    } catch (error) {
        alert(`Error parsing data.`);
    }
}

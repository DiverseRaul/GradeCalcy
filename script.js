// The courses array holds all the data in memory
let courses = JSON.parse(localStorage.getItem('courses')) || [];

// Load courses from localStorage when the page loads
function loadCourses() {
    try {
        // Get data from localStorage with key 'courses'
        const savedCourses = localStorage.getItem('courses');
        if (savedCourses) {
            courses = JSON.parse(savedCourses);
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        courses = [];
    }
}

// Save courses to localStorage whenever there's a change
function saveCourses() {
    try {
        // Save the entire courses array to localStorage
        localStorage.setItem('courses', JSON.stringify(courses));
    } catch (error) {
        console.error('Error saving courses:', error);
        alert('Failed to save changes. Your browser storage might be full.');
    }
}

// Export data to a file
function exportData() {
    const data = JSON.stringify(courses, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `grade-calculator-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import data from a file
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                courses = importedData;
                saveCourses();
                displayCourses();
                alert('Data imported successfully!');
            } else {
                alert('Invalid backup file format.');
            }
        } catch (error) {
            console.error('Error importing data:', error);
            alert('Failed to import data. The file might be corrupted.');
        }
    };
    reader.readAsText(file);
}

// Add data management UI next to the Add Course button
document.addEventListener('DOMContentLoaded', () => {
    // Add export/import buttons next to Add Course
    const buttonContainer = document.querySelector('.col');
    if (buttonContainer) {
        buttonContainer.insertAdjacentHTML('beforeend', `
            <div class="btn-group ms-2">
                <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i class="bi bi-gear"></i> Data
                </button>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="#" onclick="exportData()">
                        <i class="bi bi-download"></i> Export Backup
                    </a></li>
                    <li>
                        <label class="dropdown-item" style="cursor: pointer;">
                            <i class="bi bi-upload"></i> Import Backup
                            <input type="file" accept=".json" 
                                   onchange="importData(event)" 
                                   style="display: none;">
                        </label>
                    </li>
                    <li><a class="dropdown-item" href="#" onclick="showSettingsModal()">
                        <i class="bi bi-gear"></i> Settings
                    </a></li>
                </ul>
            </div>
        `);
    }
    
    // Load saved courses
    loadCourses();
    displayCourses();
});

const ASSIGNMENT_TYPES = {
    'practice': { name: 'Practice', weight: 0.10, color: '#0d6efd' },
    'minor': { name: 'Minor', weight: 0.40, color: '#198754' },
    'major': { name: 'Major', weight: 0.50, color: '#dc3545' }
};

const NOTE_TYPES = {
    lecture: { name: 'Lecture Notes', icon: 'bi-book' },
    homework: { name: 'Homework Notes', icon: 'bi-pencil' },
    activity: { name: 'Class Activity', icon: 'bi-people' },
    reminder: { name: 'Reminder', icon: 'bi-bell' }
};

function generateRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 80%, 40%)`; // More saturated base color
}

function getColorVariants(color) {
    const matches = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (matches) {
        const [_, h, s, l] = matches;
        return {
            background: `hsl(${h}, 85%, 95%)`,  // Very light background
            border: `hsl(${h}, 80%, 40%)`,      // Saturated border
            text: `hsl(${h}, 80%, 20%)`,        // Dark text that matches the color theme
            glow: `hsl(${h}, 80%, 50%, 0.15)`   // Transparent glow effect
        };
    }
    return {
        background: color,
        border: color,
        text: '#000000',
        text2: '#ffffff',
        glow: 'rgba(255, 255, 255, 0.1)'
    };
}

function getGradeColor(grade) {
    if (grade >= 100) return '#0d6efd'; // Blue
    if (grade >= 90) return '#198754';  // Green
    if (grade >= 80) return '#79b530';  // Green-yellow
    if (grade >= 70) return '#ffc107';  // Yellow
    if (grade >= 60) return '#fd7e14';  // Orange
    return '#dc3545';                   // Red
}

let addCourseModal, courseDetailModal, notesModal, addNoteModal;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize modals when the page loads
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        // Remove aria-hidden when modal opens
        modal.addEventListener('show.bs.modal', function() {
            this.removeAttribute('aria-hidden');
            // Set inert on other content
            document.querySelectorAll('body > *:not(.modal):not(.modal-backdrop)').forEach(element => {
                element.inert = true;
            });
        });

        // Clean up when modal closes
        modal.addEventListener('hide.bs.modal', function() {
            // Remove inert from other content
            document.querySelectorAll('body > *:not(.modal):not(.modal-backdrop)').forEach(element => {
                element.inert = false;
            });
            // Clear any focused elements
            if (document.activeElement && document.activeElement !== document.body) {
                document.activeElement.blur();
            }
        });

        // Final cleanup after modal is hidden
        modal.addEventListener('hidden.bs.modal', function() {
            // Remove any remaining aria attributes
            this.removeAttribute('aria-hidden');
            // Remove any lingering backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            // Restore focus only after modal is fully hidden
            if (lastFocusedElement) {
                setTimeout(() => {
                    lastFocusedElement.focus();
                    lastFocusedElement = null;
                }, 0);
            }
            // Update the course cards
            displayCourses();
        });
    });

    addCourseModal = new bootstrap.Modal(document.getElementById('addCourseModal'));
    courseDetailModal = new bootstrap.Modal(document.getElementById('courseDetailModal'));
    notesModal = new bootstrap.Modal(document.getElementById('notesModal'));
    addNoteModal = new bootstrap.Modal(document.getElementById('addNoteModal'));
    displayCourses();
});

// Store the element that had focus before opening modal
let lastFocusedElement = null;

function showCourseDetail(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    // Store the element that triggered the modal
    lastFocusedElement = document.activeElement;

    const modal = document.getElementById('courseDetailModal');
    const modalTitle = document.getElementById('courseDetailTitle');
    const modalContent = document.getElementById('courseDetailContent');

    modalTitle.textContent = course.name;
    
    // Update modal content
    modalContent.innerHTML = `
        <div class="text-center mb-4">
            <h1 class="grade-display text-white" style="margin-bottom: 0.5rem; font-size: 3rem; color: ${getGradeColor(calculateOverallGrade(calculateGradesByType(course.assignments)))}">
                ${calculateOverallGrade(calculateGradesByType(course.assignments)).toFixed(1)}%
            </h1>
            ${course.description ? `<p class="text-muted mb-2">${course.description}</p>` : ''}
            <div class="grade-progress-container">
                <div class="grade-progress-bar" style="width: ${Math.min(100, calculateOverallGrade(calculateGradesByType(course.assignments)))}%; background-color: ${getGradeColor(calculateOverallGrade(calculateGradesByType(course.assignments)))}"></div>
            </div>
        </div>
        
        <div class="grade-breakdown mb-4">
            <div class="assignment-type practice-type">
                <span>Practice (10%)</span>
                <span>${calculateGradesByType(course.assignments).practice !== null ? calculateGradesByType(course.assignments).practice.toFixed(1) + '%' : 'No grades'}</span>
            </div>
            <div class="assignment-type minor-type">
                <span>Minor (40%)</span>
                <span>${calculateGradesByType(course.assignments).minor !== null ? calculateGradesByType(course.assignments).minor.toFixed(1) + '%' : 'No grades'}</span>
            </div>
            <div class="assignment-type major-type">
                <span>Major (50%)</span>
                <span>${calculateGradesByType(course.assignments).major !== null ? calculateGradesByType(course.assignments).major.toFixed(1) + '%' : 'No grades'}</span>
            </div>
        </div>

        <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex gap-2">
                <button class="btn btn-primary" onclick="showNotesModal()">
                    <i class="bi bi-journal-text"></i> View Notes
                </button>
                <button class="btn btn-primary" onclick="document.getElementById('importModal').style.display='flex'">
                    <i class="bi bi-upload"></i> Import
                </button>
            </div>
            <button class="btn btn-danger" onclick="removeCourse(${course.id}, event)">
                <i class="bi bi-trash"></i> Delete Course
            </button>
        </div>

        <div id="importModal" class="modal-overlay" style="display: none;" onclick="if(event.target === this) this.style.display='none'">
            <div class="import-modal" onclick="event.stopPropagation()">
                <h5 class="mb-3">Import Assignments</h5>
                <p class="text-muted small mb-2">Paste your assignments below, one per line in any of these formats:</p>
                <pre class="import-example">
Quiz 1    95    major    2025-02-15
Homework,85,minor,2025-02-20
Lab 3 90 practice 2025-03-01</pre>
                <textarea id="importText" class="form-control mb-3" rows="5" 
                    placeholder="Paste assignments here..."></textarea>
                <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-secondary" onclick="document.getElementById('importModal').style.display='none'">
                        Cancel
                    </button>
                    <button class="btn btn-primary" onclick="handleImport(${course.id})">
                        Import
                    </button>
                </div>
            </div>
        </div>

        <div class="mb-4">
            <form onsubmit="addAssignment(${course.id}, event)">
                <div class="input-group mb-2">
                    <input type="text" class="form-control" id="assignmentName" 
                           placeholder="Assignment Name" required
                           style="flex: 2;">
                </div>
                <div class="input-group">
                    <input type="number" class="form-control" id="assignmentScore" 
                           placeholder="Score (0-100)" min="0" max="100" required
                           style="flex: 1;">
                    <select class="form-select" id="assignmentType" required
                            style="flex: 1;">
                        <option value="">Select Type</option>
                        <option value="practice">Practice</option>
                        <option value="minor">Minor</option>
                        <option value="major">Major</option>
                    </select>
                    <input type="date" class="form-control" id="assignmentDueDate"
                           style="flex: 1;">
                    <button type="submit" class="btn btn-primary"
                            style="flex: 0 0 auto; min-width: 100px;">
                        Add
                    </button>
                </div>
            </form>
        </div>

        <ul class="nav nav-tabs assignment-tabs mb-3" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#major-tab" type="button">
                    Major (${course.assignments.filter(a => a.type === 'major').length})
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#minor-tab" type="button">
                    Minor (${course.assignments.filter(a => a.type === 'minor').length})
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#practice-tab" type="button">
                    Practice (${course.assignments.filter(a => a.type === 'practice').length})
                </button>
            </li>
        </ul>

        <div class="tab-content assignments-list">
            <div class="tab-pane fade show active" id="major-tab">
                ${renderAssignmentList(course, 'major')}
            </div>
            <div class="tab-pane fade" id="minor-tab">
                ${renderAssignmentList(course, 'minor')}
            </div>
            <div class="tab-pane fade" id="practice-tab">
                ${renderAssignmentList(course, 'practice')}
            </div>
        </div>
    `;
    
    // Show modal using Bootstrap's API
    const bsModal = new bootstrap.Modal(modal);
    modal.removeAttribute('aria-hidden'); // Remove aria-hidden before showing
    bsModal.show();

    // Set focus after a short delay to ensure modal is visible
    setTimeout(() => {
        const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }, 50);
}

function showNotesModal(courseId) {
    lastFocusedElement = document.activeElement;
    
    const modal = document.getElementById('notesModal');
    modal.removeAttribute('aria-hidden'); // Remove aria-hidden before showing
    
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    document.getElementById('notesModalTitle').textContent = course.name;
    updateMonthSelector(course);
    
    // Show modal using Bootstrap's API
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    // Set focus after a short delay
    setTimeout(() => {
        const monthSelect = document.getElementById('noteMonth');
        if (monthSelect) {
            monthSelect.focus();
        }
    }, 50);
}

function showAddCourseModal() {
    lastFocusedElement = document.activeElement;
    
    const modal = document.getElementById('addCourseModal');
    modal.removeAttribute('aria-hidden'); // Remove aria-hidden before showing
    
    // Show modal using Bootstrap's API
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    // Set focus after a short delay
    setTimeout(() => {
        const courseNameInput = document.getElementById('courseName');
        if (courseNameInput) {
            courseNameInput.focus();
        }
    }, 50);
}

function addCourse(event) {
    event.preventDefault();
    const courseName = document.getElementById('courseName').value.trim();
    const courseDescription = document.getElementById('courseDescription').value.trim();
    
    if (!courseName) {
        alert('Please enter a course name');
        return;
    }

    courses.push({
        id: Date.now(),
        name: courseName,
        description: courseDescription,
        assignments: [],
        notes: {}
    });

    saveCourses();
    
    // Close modal using Bootstrap's API
    const modal = bootstrap.Modal.getInstance(document.getElementById('addCourseModal'));
    modal.hide();
}

function importAssignments(courseId, text) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    let added = 0;
    let errors = [];

    lines.forEach((line, index) => {
        const parts = line.includes(',') ? 
            line.split(',') : 
            line.split(/\s+/);

        if (parts.length >= 3) {
            const name = parts[0].trim();
            const score = parseFloat(parts[1]);
            const type = parts[2].toLowerCase().trim();
            const dueDate = parts[3] ? parts[3].trim() : null;

            if (!name) {
                errors.push(`Line ${index + 1}: Missing name`);
                return;
            }

            if (isNaN(score) || score < 0 || score > 100) {
                errors.push(`Line ${index + 1}: Invalid score (must be 0-100)`);
                return;
            }

            if (!['major', 'minor', 'practice'].includes(type)) {
                errors.push(`Line ${index + 1}: Invalid type (must be major, minor, or practice)`);
                return;
            }

            if (dueDate && isNaN(new Date(dueDate).getTime())) {
                errors.push(`Line ${index + 1}: Invalid date format`);
                return;
            }

            course.assignments.push({ name, score, type, dueDate });
            added++;
        } else {
            errors.push(`Line ${index + 1}: Invalid format`);
        }
    });

    saveCourses();
    showCourseDetail(courseId);

    return { added, errors };
}

function handleImport(courseId) {
    const text = document.getElementById('importText').value;
    const result = importAssignments(courseId, text);
    
    if (result.errors.length > 0) {
        alert(`Imported ${result.added} assignments with ${result.errors.length} errors:\n\n${result.errors.join('\n')}`);
    } else {
        alert(`Successfully imported ${result.added} assignments!`);
    }
    
    document.getElementById('importModal').style.display = 'none';
    document.getElementById('importText').value = '';
}

function renderAssignmentList(course, type) {
    if (!course.assignments || course.assignments.length === 0) {
        return '<p class="text-muted">No assignments yet.</p>';
    }

    const assignments = course.assignments
        .filter(a => a.type === type)
        .sort((a, b) => {
            if (a.dueDate && b.dueDate) {
                return new Date(b.dueDate) - new Date(a.dueDate);
            }
            return 0;
        });

    if (assignments.length === 0) {
        return '<p class="text-muted">No ' + type + ' assignments yet.</p>';
    }

    return `
        <div class="assignments-group">
            ${assignments.map(assignment => `
                <div class="assignment-item ${assignment.type}-type">
                    <div class="assignment-header">
                        <h6 class="assignment-name">${assignment.name}</h6>
                        <div class="assignment-score">${assignment.score}%</div>
                    </div>
                    ${assignment.dueDate ? 
                        `<small class="text-muted">Due: ${formatDate(assignment.dueDate)}</small>` : 
                        ''}
                    <button class="btn btn-sm btn-link text-danger" 
                            onclick="deleteAssignment(${course.id}, ${course.assignments.indexOf(assignment)}, event)">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

function addAssignment(courseId, event) {
    event.preventDefault();
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const assignmentName = document.getElementById('assignmentName').value.trim();
    const assignmentType = document.getElementById('assignmentType').value;
    const assignmentScore = parseFloat(document.getElementById('assignmentScore').value);
    const assignmentDueDate = document.getElementById('assignmentDueDate').value;

    if (!assignmentName || isNaN(assignmentScore) || assignmentScore < 0 || assignmentScore > 100) {
        alert('Please enter valid assignment details');
        return;
    }

    course.assignments.push({
        id: Date.now(),
        name: assignmentName,
        type: assignmentType,
        score: assignmentScore,
        dueDate: assignmentDueDate
    });

    saveCourses();
    displayCourses();
    showCourseDetail(courseId); // Refresh the course detail modal

    // Clear form
    document.getElementById('assignmentName').value = '';
    document.getElementById('assignmentScore').value = '';
    document.getElementById('assignmentDueDate').value = '';
}

function deleteAssignment(courseId, assignmentId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    course.assignments = course.assignments.filter(a => a.id !== assignmentId);
    saveCourses();
    displayCourses();
    showCourseDetail(courseId); // Refresh the course detail modal
}

function displayCourses() {
    const container = document.getElementById('coursesContainer');
    if (!container) return;

    // Clear the container
    container.innerHTML = '';

    if (settings.viewStyle === 'cards') {
        container.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4';
        courses.forEach(course => {
            const gradesByType = calculateGradesByType(course.assignments);
            const overallGrade = calculateOverallGrade(gradesByType);
            
            const col = document.createElement('div');
            col.className = 'col';
            col.setAttribute('draggable', 'true');
            col.setAttribute('data-course-id', course.id);
            
            col.innerHTML = `
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title">${course.name}</h5>
                            <div class="dropdown">
                                <button class="btn btn-icon" data-bs-toggle="dropdown">
                                    <i class="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li><a class="dropdown-item" href="#" onclick="showCourseDetail(${course.id})">
                                        <i class="bi bi-pencil-square"></i> Edit
                                    </a></li>
                                    <li><a class="dropdown-item text-danger" href="#" onclick="removeCourse(${course.id}, event)">
                                        <i class="bi bi-trash"></i> Delete
                                    </a></li>
                                </ul>
                            </div>
                        </div>
                        <p class="card-text">${course.description || 'No description'}</p>
                        <div class="grade-display" onclick="showCourseDetail(${course.id})">
                            <div class="grade-value">${overallGrade !== null ? overallGrade.toFixed(1) + '%' : 'No grades'}</div>
                            <div class="grade-progress-container">
                                <div class="grade-progress" style="width: ${overallGrade || 0}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(col);
        });
    } else {
        container.className = 'list-view';
        const table = document.createElement('table');
        table.className = 'table table-hover';
        
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Course Name</th>
                    <th>Description</th>
                    <th>Grade</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${courses.map(course => {
                    const gradesByType = calculateGradesByType(course.assignments);
                    const overallGrade = calculateOverallGrade(gradesByType);
                    return `
                        <tr>
                            <td>${course.name}</td>
                            <td>${course.description || 'No description'}</td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="grade-value me-2">${overallGrade !== null ? overallGrade.toFixed(1) + '%' : 'No grades'}</div>
                                    <div class="grade-progress-container" style="width: 100px">
                                        <div class="grade-progress" style="width: ${overallGrade || 0}%"></div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-primary" onclick="showCourseDetail(${course.id})">
                                        <i class="bi bi-pencil-square"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="removeCourse(${course.id}, event)">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        `;
        
        container.appendChild(table);
    }

    // Add drag and drop event listeners
    if (settings.viewStyle === 'cards') {
        const cols = container.querySelectorAll('.col');
        cols.forEach(col => {
            col.addEventListener('dragstart', handleDragStart);
            col.addEventListener('dragend', handleDragEnd);
            col.addEventListener('dragover', handleDragOver);
            col.addEventListener('dragenter', handleDragEnter);
            col.addEventListener('dragleave', handleDragLeave);
            col.addEventListener('drop', handleDrop);
        });
    }
}

// Drag and Drop Functionality
let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.courseId);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedItem = null;
    document.querySelectorAll('.col').forEach(col => {
        col.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    
    if (draggedItem === this) return;
    
    const draggedCourseId = parseInt(e.dataTransfer.getData('text/plain'));
    const dropTargetCourseId = parseInt(this.dataset.courseId);
    
    const draggedIndex = courses.findIndex(c => c.id === draggedCourseId);
    const dropIndex = courses.findIndex(c => c.id === dropTargetCourseId);
    
    if (draggedIndex !== -1 && dropIndex !== -1) {
        // Reorder the courses array
        const [draggedCourse] = courses.splice(draggedIndex, 1);
        courses.splice(dropIndex, 0, draggedCourse);
        saveCourses();
        displayCourses();
    }
    
    return false;
}

function calculateGradesByType(assignments) {
    const grades = {
        practice: { sum: 0, count: 0 },
        minor: { sum: 0, count: 0 },
        major: { sum: 0, count: 0 }
    };

    assignments.forEach(assignment => {
        grades[assignment.type].sum += assignment.score;
        grades[assignment.type].count++;
    });

    return {
        practice: grades.practice.count > 0 ? grades.practice.sum / grades.practice.count : null,
        minor: grades.minor.count > 0 ? grades.minor.sum / grades.minor.count : null,
        major: grades.major.count > 0 ? grades.major.sum / grades.major.count : null
    };
}

function calculateOverallGrade(gradesByType) {
    let totalWeight = 0;
    let weightedSum = 0;
    
    // Only include types that have grades
    if (gradesByType.practice !== null) {
        weightedSum += gradesByType.practice * 0.1;
        totalWeight += 0.1;
    }
    
    if (gradesByType.minor !== null) {
        weightedSum += gradesByType.minor * 0.4;
        totalWeight += 0.4;
    }
    
    if (gradesByType.major !== null) {
        weightedSum += gradesByType.major * 0.5;
        totalWeight += 0.5;
    }
    
    // If no grades at all, return 0
    if (totalWeight === 0) return 0;
    
    // Adjust the weighted sum based on actual weights
    return weightedSum / totalWeight;
}

function removeCourse(courseId, event) {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this course?')) {
        courseDetailModal.hide();
        courses = courses.filter(course => course.id !== courseId);
        saveCourses();
        displayCourses();
    }
}

function deleteCourse(courseId) {
    courses = courses.filter(course => course.id !== courseId);
    saveCourses();
}

function formatDate(dateInput, includeYear = false) {
    if (!dateInput) return '';
    
    // Convert string to Date if needed
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return '';
    
    const options = {
        month: 'short',
        day: 'numeric'
    };
    
    if (includeYear) {
        options.year = 'numeric';
    }
    
    return date.toLocaleDateString('en-US', options);
}

function updateMonthSelector(course) {
    const monthSelect = document.getElementById('noteMonth');
    const months = new Set();
    
    // Add current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    months.add(currentMonth);
    
    // Get previous month
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    months.add(`${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`);
    
    // Get next month
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    months.add(`${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`);
    
    // Add months from notes
    if (course.notes) {
        Object.keys(course.notes).forEach(date => {
            const noteDate = new Date(date);
            const monthKey = `${noteDate.getFullYear()}-${String(noteDate.getMonth() + 1).padStart(2, '0')}`;
            months.add(monthKey);
        });
    }
    
    // Sort months in descending order
    const sortedMonths = Array.from(months).sort((a, b) => b.localeCompare(a));
    
    // Generate options
    monthSelect.innerHTML = sortedMonths.map(monthKey => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return `<option value="${monthKey}">${monthName}</option>`;
    }).join('');
    
    // Select current month
    monthSelect.value = currentMonth;
    
    // Update week options for the selected month
    updateWeekOptions();
}

function updateWeekOptions() {
    const monthSelect = document.getElementById('noteMonth');
    const weekSelect = document.getElementById('noteWeek');
    const selectedMonth = monthSelect.value; // Format: "YYYY-MM"
    
    // Parse year and month
    const [year, month] = selectedMonth.split('-');
    const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1);
    const lastDay = new Date(parseInt(year), parseInt(month), 0);
    
    // Generate weeks for the month
    const weeks = [];
    let currentDate = new Date(firstDay);
    
    // Go to the first day of the first week
    while (currentDate.getDay() !== 0) {
        currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Generate weeks until we pass the end of the month
    while (currentDate <= lastDay) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        weeks.push({
            start: weekStart,
            end: weekEnd,
            key: weekStart.toISOString().split('T')[0]
        });
        
        // Move to next week
        currentDate.setDate(currentDate.getDate() + 7);
    }
    
    // Generate options for each week
    weekSelect.innerHTML = weeks.map((week, index) => {
        const weekNum = index + 1;
        const startLabel = formatDate(week.start);
        const endLabel = formatDate(week.end);
        return `<option value="${week.key}">Week ${weekNum} (${startLabel} - ${endLabel})</option>`;
    }).join('');
    
    // Select current week if viewing current month
    const today = new Date();
    if (selectedMonth === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`) {
        const currentWeek = weeks.find(week => 
            today >= week.start && today <= week.end
        );
        if (currentWeek) {
            weekSelect.value = currentWeek.key;
        }
    } else if (weeks.length > 0) {
        // Select first week of other months
        weekSelect.value = weeks[0].key;
    }
    
    // Trigger notes display
    filterNotesByWeek();
}

function filterNotesByWeek() {
    const courseId = getCurrentCourseId();
    const course = courses.find(c => c.id === courseId);
    displayNotes(course);
}

function displayNotes(course) {
    const notesList = document.querySelector('.notes-list');
    if (!course.notes || Object.keys(course.notes).length === 0) {
        notesList.innerHTML = '<p class="text-muted">No class notes yet. Add your first note!</p>';
        return;
    }

    const weekSelect = document.getElementById('noteWeek');
    if (!weekSelect.value) {
        notesList.innerHTML = '<p class="text-muted">Please select a week to view notes.</p>';
        return;
    }

    const selectedWeekStart = new Date(weekSelect.value);
    const selectedWeekEnd = new Date(selectedWeekStart);
    selectedWeekEnd.setDate(selectedWeekStart.getDate() + 6);
    
    const sortedDates = Object.keys(course.notes)
        .filter(date => {
            const noteDate = new Date(date);
            return noteDate >= selectedWeekStart && noteDate <= selectedWeekEnd;
        })
        .sort((a, b) => new Date(b) - new Date(a));

    if (sortedDates.length === 0) {
        notesList.innerHTML = '<p class="text-muted">No notes for this week. Add your first note!</p>';
        return;
    }

    notesList.innerHTML = sortedDates.map(date => {
        const displayDate = new Date(date);
        const dayName = displayDate.toLocaleDateString('en-US', { weekday: 'long' });
        
        return `
        <div class="note-group mb-4">
            <h6 class="note-date">${dayName}, ${formatDate(displayDate)}</h6>
            ${course.notes[date].map(note => `
                <div class="note-item note-type-${note.type}">
                    <div class="note-header">
                        <span class="note-type">
                            <i class="${NOTE_TYPES[note.type].icon}"></i> 
                            ${NOTE_TYPES[note.type].name}
                        </span>
                        <button class="btn btn-sm btn-link text-danger" onclick="deleteNote('${course.id}', '${date}', ${note.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                    <h5 class="note-topic">${note.topic}</h5>
                    <div class="note-details">${note.details.replace(/\n/g, '<br>')}</div>
                    <small class="text-muted">${new Date(note.timestamp).toLocaleTimeString()}</small>
                </div>
            `).join('')}
        </div>
    `}).join('');
}

function deleteNote(courseId, date, noteId) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    const course = courses.find(c => c.id === courseId);
    if (!course.notes || !course.notes[date]) return;
    
    course.notes[date] = course.notes[date].filter(note => note.id !== noteId);
    
    // Remove the date entry if no notes left for that date
    if (course.notes[date].length === 0) {
        delete course.notes[date];
    }
    
    saveCourses();
    displayNotes(course);
}

function getCurrentCourseId() {
    const title = document.getElementById('courseDetailTitle');
    const course = courses.find(c => c.name === title.textContent);
    return course ? course.id : null;
}

function getMonthInfo(date) {
    const d = new Date(date);
    return {
        key: d.toISOString().substring(0, 7), // YYYY-MM
        label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
}

function getWeekInfo(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return {
        start,
        end,
        key: start.toISOString().split('T')[0]
    };
}

// Settings Management
let settings = {
    darkMode: true,
    accentColor: '#3b82f6',
    viewStyle: 'cards',
    notifications: {
        enabled: false,
        assignmentReminders: true,
        gradeUpdates: true
    }
};

function loadSettings() {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
        settings = { ...settings, ...JSON.parse(savedSettings) };
    }
    applySettings();
}

function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings));
}

function applySettings() {
    // Apply dark mode
    document.body.classList.toggle('dark-mode', settings.darkMode);
    document.documentElement.setAttribute('data-bs-theme', settings.darkMode ? 'dark' : 'light');
    
    // Apply accent color
    document.documentElement.style.setProperty('--accent-color', settings.accentColor);
    
    // Update UI elements
    document.getElementById('darkModeToggle').checked = settings.darkMode;
    document.getElementById('viewStyleSelect').value = settings.viewStyle;
    document.getElementById('notificationsToggle').checked = settings.notifications.enabled;
    document.getElementById('assignmentRemindersToggle').checked = settings.notifications.assignmentReminders;
    document.getElementById('gradeUpdatesToggle').checked = settings.notifications.gradeUpdates;
    
    // Update active color option
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === settings.accentColor);
    });
    
    // Update view
    displayCourses();
    
    saveSettings();
}

// Modal functions
function showSettingsModal() {
    const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
    modal.show();
}

// Settings Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Dark mode toggle
    document.getElementById('darkModeToggle')?.addEventListener('change', (e) => {
        settings.darkMode = e.target.checked;
        applySettings();
    });

    // Color options
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', () => {
            settings.accentColor = btn.dataset.color;
            applySettings();
        });
    });

    // Notification toggles
    document.getElementById('notificationsToggle')?.addEventListener('change', async (e) => {
        if (e.target.checked) {
            const granted = await requestNotificationPermission();
            if (!granted) {
                e.target.checked = false;
                return;
            }
        }
        settings.notifications.enabled = e.target.checked;
        applySettings();
    });

    document.getElementById('assignmentRemindersToggle')?.addEventListener('change', (e) => {
        settings.notifications.assignmentReminders = e.target.checked;
        applySettings();
    });

    document.getElementById('gradeUpdatesToggle')?.addEventListener('change', (e) => {
        settings.notifications.gradeUpdates = e.target.checked;
        applySettings();
    });

    // View style toggle
    document.getElementById('viewStyleSelect')?.addEventListener('change', (e) => {
        settings.viewStyle = e.target.value;
        applySettings();
    });

    // Load settings when page loads
    loadSettings();
});

// Notification System
let notificationPermission = false;

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('This browser does not support notifications');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        notificationPermission = permission === 'granted';
        return notificationPermission;
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
}

function showNotification(title, options = {}) {
    if (!settings.notifications.enabled || !notificationPermission) return;

    const defaultOptions = {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        silent: false,
        timestamp: Date.now()
    };

    new Notification(title, { ...defaultOptions, ...options });
}

function checkUpcomingAssignments() {
    if (!settings.notifications.enabled || !settings.notifications.assignmentReminders) return;

    const today = new Date();
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 2);

    courses.forEach(course => {
        course.assignments.forEach(assignment => {
            if (!assignment.dueDate || assignment.notified) return;

            const dueDate = new Date(assignment.dueDate);
            if (dueDate > today && dueDate <= twoDaysFromNow) {
                showNotification(`Upcoming Assignment in ${course.name}`, {
                    body: `"${assignment.name}" is due on ${formatDate(assignment.dueDate)}`,
                    tag: `assignment-${assignment.id}`
                });
                assignment.notified = true;
            }
        });
    });
}

function notifyGradeUpdate(courseName, oldGrade, newGrade) {
    if (!settings.notifications.enabled || !settings.notifications.gradeUpdates) return;

    const gradeChanged = Math.abs(newGrade - oldGrade) >= 0.1;
    if (gradeChanged) {
        const trend = newGrade > oldGrade ? '📈' : '📉';
        showNotification(`Grade Update for ${courseName}`, {
            body: `Your grade has changed from ${oldGrade.toFixed(1)}% to ${newGrade.toFixed(1)}% ${trend}`,
            tag: `grade-${courseName}`
        });
    }
}

// Check for upcoming assignments periodically
setInterval(checkUpcomingAssignments, 1800000); // Check every 30 minutes

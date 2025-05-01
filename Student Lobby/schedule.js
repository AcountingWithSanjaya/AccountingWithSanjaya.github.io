document.addEventListener('DOMContentLoaded', () => {
    const classList = document.getElementById('classList');

    async function fetchClasses() {
        try {
            const response = await fetch('http://deka.pylex.software:11219/schedule');
            if (!response.ok) {
                throw new Error('Failed to fetch classes');
            }
            const classes = await response.json();
            displayClasses(classes);
        } catch (error) {
            classList.innerHTML = `
                <div class="error-message">
                    Failed to load classes. Please try again later.
                </div>
            `;
        }
    }

    function displayClasses(classes) {
        classList.innerHTML = classes.map(classItem => {
            const startTime = new Date(classItem.startTime);
            const endTime = new Date(classItem.endTime);
            
            return `
                <div class="class-card">
                    <div class="class-details">
                        <h3>${classItem.title}</h3>
                        <div class="class-info">
                            <div class="class-time">
                                ${startTime.toLocaleDateString()} | 
                                ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                                ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div class="class-instructor">
                                Instructor: ${classItem.instructor}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    fetchClasses();
    setInterval(fetchClasses, 60000);
});
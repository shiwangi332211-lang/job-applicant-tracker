
const form = document.getElementById("JObForm");
const notification = document.getElementById("notification");
let notificationTimer;
const jobList = document.getElementById("Joblist");
const emptyMessage = document.getElementById("emptyMessage");
const search = document.getElementById("search");
const filterStatus = document.getElementById("filterstatus");
let applications = JSON.parse(
    localStorage.getItem("launchCareerJobs") || "[]"
);
function saveApplications() {
    localStorage.setItem(
        "launchCareerJobs",
        JSON.stringify(applications)
    );
}
function showNotification(message) {
    notification.textContent = message;
    notification.style.display = "block";
    clearTimeout(notificationTimer);
    notificationTimer = setTimeout(function () {
        notification.style.display = "none";
    }, 3000);
}
function formatDate(date) {
    if (!date) return "";
    return new Date(date + "T00:00:00").toLocaleDateString(
        "en-IN",
        { day: "numeric", month: "short", year: "numeric" }
    );
}
function showApplications() {
    jobList.innerHTML = "";
    document.getElementById("totalCount").textContent =
        applications.length;
    document.getElementById("interviewCount").textContent =
        applications.filter(function(job) {
            return job.status === "Interview";
        }).length;
    document.getElementById("selectedCount").textContent =
        applications.filter(function(job) {
            return job.status === "Selected";
        }).length;
    const searchText = search.value.toLowerCase();
    const selectedStatus = filterStatus.value;
    const filteredJobs = applications.filter(function(job) {
        const matchesSearch =
            job.company.toLowerCase().includes(searchText) ||
            job.role.toLowerCase().includes(searchText);
        const matchesStatus =
            selectedStatus === "All" ||
            job.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });
    emptyMessage.style.display =
        filteredJobs.length === 0 ? "block" : "none";
    filteredJobs.forEach(function(job) {
        const card = document.createElement("div");
        card.className = "job-card";
        const company = document.createElement("h3");
        company.textContent =
            job.company.charAt(0).toUpperCase() +
            job.company.slice(1);
        const role = document.createElement("p");
        role.textContent = "Role: " + job.role;
        const date = document.createElement("p");
        date.textContent = "Applied on: " + formatDate(job.date);
        const status = document.createElement("span");
        status.className = "status-badge " + job.status.toLowerCase();
        status.textContent = job.status
        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.addEventListener("click", function() {
            const newCompany = prompt(
                "Enter company name:",
                job.company
            );
            if (newCompany === null) return;
            const newRole = prompt(
                "Enter job role:",
                job.role
            );
            if (newRole === null) return;
            const newDate = prompt(
                "Enter applied date (YYYY-MM-DD):",
                job.date
            );
            if (newDate === null) return;
            const newStatus = prompt(
                "Enter status: Applied, Interview, Selected or Rejected",
                job.status
            );
            if (newStatus === null) return;
            const validStatuses = [
                "Applied",
                "Interview",
                "Selected",
                "Rejected"
            ];
            const matchingStatus = validStatuses.find(function(item) {
                return item.toLowerCase() ===
                    newStatus.trim().toLowerCase();
            });
            const datePattern = /^\d{4}-\d{2}-\d{2}$/;
            const parsedDate = new Date(newDate + "T00:00:00");
            const validDate =
                datePattern.test(newDate) &&
                !Number.isNaN(parsedDate.getTime()) &&
                parsedDate.toISOString().slice(0, 10) === newDate;
            if (
                !newCompany.trim() ||
                !newRole.trim() ||
                !validDate ||
                !matchingStatus
            ) {
                alert(
                    "Please enter valid company, role, date and status."
                );
                return;
            }
            job.company = newCompany.trim();
            job.role = newRole.trim();
            job.date = newDate;
            job.status = matchingStatus;
            saveApplications();
            showApplications();
        });
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", function() {
            const confirmed = confirm(
                "Delete this application?"
            );
            if (!confirmed) return;
            applications = applications.filter(function(item) {
                return item.id !== job.id;
            });
            saveApplications();
            showApplications();
        });
        const details = document.createElement("div");
        details.className = "job-details";
        details.append(company, role, date);
        card.append(
            details,
            status,
            editButton,
            deleteButton
        );
        jobList.appendChild(card);
    });
}
form.addEventListener("submit", function(event) {
    event.preventDefault();
    const company = document.getElementById("Company").value.trim();
    const role = document.getElementById("role").value.trim();
    const date = document.getElementById("date").value;
    const status = document.getElementById("status").value;
    if (!company || !role || !date || !status) {
        alert("Please fill in all fields.");
        return;
    }
    const newJob = {
        id: Date.now(),
        company: company,
        role: role,
        date: date,
        status: status
    };
    applications.push(newJob);
saveApplications();
showApplications();
showNotification("Application added successfully!");
form.reset();
});
search.addEventListener("input", showApplications);
filterStatus.addEventListener("change", showApplications);
showApplications();
document.querySelectorAll(".quick-filter").forEach(function(button) {
    button.addEventListener("click", function() {
        filterStatus.value = button.dataset.status;
        showApplications();
        document.querySelectorAll(".quick-filter").forEach(function(btn) {
            btn.classList.remove("active");
        });
        button.classList.add("active");
    });
});
document.getElementById("exportBtn").addEventListener("click", function () {
    if (applications.length === 0) {
        showNotification("No applications to export!");
        return;
    }
    const headers = ["Company", "Role", "Applied Date", "Status"];
    const rows = applications.map(function (job) {
        return [job.company, job.role, job.date, job.status];
    });
    const csvContent = [headers, ...rows]
        .map(function (row) {
            return row.map(function (value) {
                return '"' + String(value ?? "").replace(/"/g, '""') + '"';
            }).join(",");
        }).join("\n");
    const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "LaunchCareer_Applications.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    showNotification("Applications exported successfully!");
});
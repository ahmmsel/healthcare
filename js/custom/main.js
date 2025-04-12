function showPage(pageId) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
}

function logout() {
  currentUser = null;
  localStorage.removeItem("loggedInAs");
  showPage("landing");
}

localforage.config({ name: "SmartHealthAdvisor" });

function registerUser() {
  const email = document.getElementById("regEmail").value;

  // Check if the email already exists in localforage
  localforage.getItem(email).then((existingUser) => {
    if (existingUser) {
      // If the user already exists, show an alert
      alert("الحساب موجود بالفعل");
    } else {
      // If the email is not taken, proceed with registration
      const user = {
        name: document.getElementById("fullName").value,
        age: document.getElementById("age").value,
        grade: document.getElementById("grade").value,
        illness: document.getElementById("illness").value,
        email: email,
        password: document.getElementById("regPassword").value,
        symptoms: [],
      };

      // Save the new user in localforage
      localforage.setItem(user.email, user).then(() => {
        alert("تم التسجيل بنجاح!");
        showPage("login");
      });
    }
  });
}

let currentUser = null;

function loginUser() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (email === "admin@school.com" && password === "123456") {
    localStorage.setItem("loggedInAs", "admin");
    showPage("supervisor");
    loadStudentData();
    return;
  }

  localforage.getItem(email).then((user) => {
    if (user && user.password === password) {
      currentUser = user;
      localStorage.setItem("loggedInAs", email); // Save user login
      showPage("symptoms");
    } else {
      alert("بيانات تسجيل الدخول غير صحيحة");
    }
  });
}

function analyzeSymptoms() {
  const selected = Array.from(
    document.querySelectorAll("#symptoms input[type=checkbox]:checked")
  ).map((cb) => cb.value);
  currentUser.symptoms = selected;
  localforage.setItem(currentUser.email, currentUser);

  let result = "";

  // Create the logic for symptom analysis
  if (selected.includes("Headache") && selected.includes("Fatigue")) {
    result = "يجب الحصول على قسط كافي من النوم";
  } else if (selected.includes("Dizziness") && selected.includes("Paleness")) {
    result = "الجلوس والاكل فورًا";
  } else if (
    selected.includes("Nosebleed") &&
    selected.includes("Paleness") &&
    selected.includes("Headache")
  ) {
    result = "رعاف (نزيف الانف) - اماله الراس للامام والضغط على طرف الانف";
  } else {
    result = "أعراض غير محددة - يُوصى بمراجعة الطبيب.";
  }

  // Add chronic illness message
  if (currentUser.illness !== "none") {
    result += `\nتنبيه: يعاني الطالب من ${
      currentUser.illness === "asthma"
        ? "الربو"
        : currentUser.illness === "diabetes"
        ? "السكري"
        : "الحساسية"
    }، يُفضل التواصل مع ولي الأمر.`;
  }

  // Display the result on the results page
  document.getElementById("resultText").innerText = result;
  showPage("results");
}

function loadStudentData() {
  const gradeFilter = document.getElementById("gradeFilter").value;
  localforage.keys().then((keys) => {
    let count = 0,
      chronicCount = 0,
      severeCount = 0;
    const container = document.getElementById("studentList");
    container.innerHTML = "";
    keys.forEach((email) => {
      localforage.getItem(email).then((user) => {
        if (
          user.name &&
          (gradeFilter === "all" || user.grade === gradeFilter)
        ) {
          count++;
          const hasChronic = user.illness !== "none";
          const isSevere =
            user.symptoms.includes("Fever") && user.symptoms.includes("Nausea");
          if (hasChronic) chronicCount++;
          if (isSevere) severeCount++;

          const div = document.createElement("div");
          div.className = "student-card";
          if (hasChronic || isSevere) div.classList.add("highlight");
          div.innerHTML = `<strong>${user.name}</strong> - الصف: ${getGradeName(
            user.grade
          )}<br>الأعراض: ${
            user.symptoms.join(", ") || "لا يوجد"
          }<br>المرض المزمن: ${
            user.illness === "none" ? "لا يوجد" : user.illness
          }`;
          container.appendChild(div);

          document.getElementById("summary").innerHTML = `
                <strong>عدد الطلاب:</strong> ${count}<br>
                <strong>طلاب يعانون من أمراض مزمنة:</strong> ${chronicCount}<br>
                <strong>طلاب لديهم أعراض شديدة:</strong> ${severeCount}`;
        }
      });
    });
  });
}

// Helper function to convert grade value to grade name
function getGradeName(grade) {
  const grades = {
    kindergarten: "رياض الأطفال",
    1: "الصف الأول الابتدائي",
    2: "الصف الثاني الابتدائي",
    3: "الصف الثالث الابتدائي",
    4: "الصف الرابع الابتدائي",
    5: "الصف الخامس الابتدائي",
    6: "الصف السادس الابتدائي",
    7: "الصف الأول متوسط",
    8: "الصف الثاني متوسط",
    9: "الصف الثالث متوسط",
    10: "الصف الأول ثانوي",
    11: "الصف الثاني ثانوي",
    12: "الصف الثالث ثانوي",
  };
  return grades[grade] || "غير محدد";
}

document.addEventListener("DOMContentLoaded", () => {
  const loggedIn = localStorage.getItem("loggedInAs");

  if (loggedIn === "admin") {
    showPage("supervisor");
    loadStudentData();
  } else if (loggedIn) {
    localforage.getItem(loggedIn).then((user) => {
      if (user) {
        currentUser = user;
        showPage("symptoms");
      } else {
        showPage("landing");
      }
    });
  } else {
    showPage("landing");
  }
});

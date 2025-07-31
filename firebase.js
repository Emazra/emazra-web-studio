// Load Firebase SDK dynamically
import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js").then(({ initializeApp }) => {
  import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js").then(({ getFirestore, collection, addDoc, serverTimestamp }) => {

    const firebaseConfig = {
      projectId: "emazra-websites"
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const form = document.getElementById("contactForm");
    const loading = document.querySelector(".loading");
    const sentMessage = document.querySelector(".sent-message");
    const errorMessage = document.querySelector(".error-message");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      loading.style.display = "block";
      sentMessage.style.display = "none";
      errorMessage.style.display = "none";

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const subject = document.getElementById("subject").value.trim();
      const message = document.getElementById("message").value.trim();

      try {
        await addDoc(collection(db, "messages"), {
          name,
          email,
          subject,
          message,
          timestamp: serverTimestamp()
        });

        loading.style.display = "none";
        sentMessage.style.display = "block";
        form.reset();
      } catch (err) {
        loading.style.display = "none";
        errorMessage.textContent = "Something went wrong. Please try again.";
        errorMessage.style.display = "block";
      }
    });

  });
});

document.addEventListener("DOMContentLoaded", function() {
    const passwordInput = document.getElementById("password");
    const segmentLength = document.getElementById("segment-length");
    const segmentUppercase = document.getElementById("segment-uppercase");
    const segmentNumber = document.getElementById("segment-number");

    if (passwordInput && segmentLength && segmentUppercase && segmentNumber) {
        function checkPassword() {
            const value = passwordInput.value;

            if (value.length >= 8) {
                segmentLength.classList.remove("segment-inactive");
                segmentLength.classList.add("segment-length-active");
            } else {
                segmentLength.classList.remove("segment-length-active");
                segmentLength.classList.add("segment-inactive");
            }
            if (/[A-Z]/.test(value)) {
                segmentUppercase.classList.remove("segment-inactive");
                segmentUppercase.classList.add("segment-uppercase-active");
            } else {
                segmentUppercase.classList.remove("segment-uppercase-active");
                segmentUppercase.classList.add("segment-inactive");
            }
            if (/\d/.test(value)) {
                segmentNumber.classList.remove("segment-inactive");
                segmentNumber.classList.add("segment-number-active");
            } else {
                segmentNumber.classList.remove("segment-number-active");
                segmentNumber.classList.add("segment-inactive");
            }
        }
        passwordInput.addEventListener("input", checkPassword);
        passwordInput.addEventListener("keyup", checkPassword);
        passwordInput.addEventListener("change", checkPassword);
        checkPassword();
    }
});

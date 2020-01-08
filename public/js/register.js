$(document).ready(function() {

    /// username validation
    $('#inputUsername').keyup(function() {
        if ($(this).val().length > 2 && $(this).val().length < 20) {
            $(this).removeClass('is-invalid');
            $(this).addClass('is-valid');
        } else {
            $(this).removeClass('is-valid');
            $(this).addClass('is-invalid');
        }
    });


    /// email validation
    $('#inputEmail4').keyup(function() {
        if (checkEmail()) {
            $(this).removeClass('is-invalid');
            $(this).addClass('is-valid');
        } else {
            $(this).removeClass('is-valid');
            $(this).addClass('is-invalid');
        }
    });

    function checkEmail() {
        var email = $('#inputEmail4').val();
        if ((email.indexOf(".") > 2) && (email.indexOf("@") > 0)) {
            return true;
        } else {
            return false;
        }
    }


    /// password validation

    $('#inputPassword4').keyup(function() {
        if ($('#inputPassword').val().length > 5 && $('#inputPassword').val().length < 21) {
            if ($('#inputPassword4').val() == $('#inputPassword').val()) {
                $('#inputPassword').addClass('is-valid');
                $('#inputPassword4').addClass('is-valid');
                $('#inputPassword4').removeClass('is-invalid');
                $('#inputPassword').removeClass('is-invalid');
                $('#submitBtn').attr('disabled', false);
            } else {
                $('#inputPassword').removeClass('is-valid');
                $('#inputPassword4').removeClass('is-valid');
                $('#inputPassword4').addClass('is-invalid');
                $('#inputPassword').addClass('is-invalid');
                $('#submitBtn').attr('disabled', true);
            }
        }
    });

});
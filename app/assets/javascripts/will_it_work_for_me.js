(function () {
  "use strict";
  var root = this, $ = root.jQuery;
  if (typeof root.GOVUK === 'undefined') {
    root.GOVUK = {};
  }

  var willItWorkForMe = {
    init: function () {
      willItWorkForMe.$form = $('#validate-will-it-work-for-me');
      willItWorkForMe.$notResidentReasonSection = $('#not_resident_reason');
      var errorMessage = willItWorkForMe.$form.data('msg');
      if (willItWorkForMe.$form.length === 1) {
        willItWorkForMe.validator = willItWorkForMe.$form.validate({
          rules: {
            'above_age_threshold': 'required',
            'resident_last_12_months': 'required',
            'not_resident_reason': {
              required: '#will_it_work_for_me_form_resident_last_12_months_false:checked'
            }
          },
          groups: {
            primary: 'above_age_threshold resident_last_12_months not_resident_reason'
          },
          messages: {
            'above_age_threshold': errorMessage,
            'resident_last_12_months': errorMessage,
            'not_resident_reason': errorMessage
          }
        });
        willItWorkForMe.setNotResidentReasonSectionVisibility();
        willItWorkForMe.$form.find('input[name="resident_last_12_months"]').on('click', willItWorkForMe.setNotResidentReasonSectionVisibility);
      }
    },

    setNotResidentReasonSectionVisibility: function () {
      if (willItWorkForMe.notLivedInTheUKFor12Months()) {
        willItWorkForMe.$notResidentReasonSection.removeClass('js-hidden');
      } else {
        // re-validate the "which of these applies to you" section - if we don't do this, the "Please answer all questions"
        // message remains for the section even if it's hidden by the user selecting "Yes" to "Have you lived in the UK for the last 12 months?"
        willItWorkForMe.validator.element('#will_it_work_for_me_form_not_resident_reason_movedrecently');
        willItWorkForMe.$notResidentReasonSection.addClass('js-hidden').removeClass('error')
        .find('.selected').removeClass('selected').find('input').prop('checked', false);
      }
    },
    notLivedInTheUKFor12Months: function () {
      var input = $('input[name="resident_last_12_months"]:checked');
      return input.length === 1 && input.val() === 'false';
    }
  };

  root.GOVUK.willItWorkForMe = willItWorkForMe;
}).call(this);

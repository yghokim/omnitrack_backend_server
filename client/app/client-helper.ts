import { FormBuilder, FormControl, FormGroup } from "@angular/forms";

export function makeMatchingPasswordFormGroup(formBuilder: FormBuilder, passwordForm: FormControl, confirmPasswordForm: FormControl){
  return formBuilder.group(
    {
      password: passwordForm,
      confirmPassword: confirmPasswordForm
    },
    {
      validator: (group: FormGroup) => {
        const passwordInput = group.controls["password"];
        const confirmPasswordInput = group.controls["confirmPassword"];
        if (passwordInput.value !== confirmPasswordInput.value) {
          return confirmPasswordInput.setErrors({ passwordNotMatch: true });
        } else {
          return null;
        }
      }
    }
  )
}
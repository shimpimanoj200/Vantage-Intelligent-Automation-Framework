// import { BaseScreen } from './BaseScreen.ts';

// class LoginScreen extends BaseScreen {

//     get username() {
//         return $('~username');
//     }

//     get password() {
//         return $('~password');
//     }

//     get loginButton() {
//         return $('~login-button');
//     }

//     async enterUsername(value: string) {
//         await this.enterText(this.username, value);
//     }

//     async enterPassword(value: string) {
//         await this.enterText(this.password, value);
//     }

//     async clickLogin() {
//         await this.click(this.loginButton);
//     }

//     async login(
//         username: string,
//         password: string
//     ) {
//         await this.enterUsername(username);
//         await this.enterPassword(password);
//         await this.clickLogin();
//     }
// }

// export default new LoginScreen();
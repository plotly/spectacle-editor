import React, { Component, PropTypes } from "react";
import { ipcRenderer } from "electron";

import { login } from "../../api/user";
import SocialAuthLinks from "./social-auth-links";
import commonStyles from "./index.css";

const domainUrl = "https://api.plot.ly";

class PlotlyForm extends Component {
  static contextTypes = {
    store: React.PropTypes.object
  };

  static propTypes = {
    onClose: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      username: "",
      password: "",
      errorMessage: null
    };
  }

  onLoginSuccess = (userInfo) => {
    this.context.store.api.resetDomainUrl();
    this.context.store.api.setUser(userInfo);
    this.closeModal();
    this.setState({ errorMessage: null });
  }

  onSocialLoginError = (provider) => {
    this.setState({
      errorMessage: `Uh oh! Sign in failed with ${provider}. Please try again.`
    });
  }

  onClickForgotPassword = (ev) => {
    ev.preventDefault();

    ipcRenderer.send("open-external", "https://plot.ly/accounts/password/reset/");
  }

  onClickCreateAccount = (ev) => {
    ev.preventDefault();

    ipcRenderer.send("open-external", "https://plot.ly");
  }

  handleUserChange = (ev) => {
    this.setState({ username: ev.target.value });
  }

  handlePasswordChange = (ev) => {
    this.setState({ password: ev.target.value });
  }

  handleSubmit = (ev) => {
    ev.preventDefault();

    const { username, password } = this.state;

    if (!username || !password) {
      this.setState({
        errorMessage: "Oops! The username or password was invalid."
      });

      return;
    }

    login(domainUrl, username, password)
      .then(this.onLoginSuccess)
      .catch((errorMessage) => {
        this.setState({ errorMessage });
      });
  }

  closeModal = () => {
    this.props.onClose();
    this.setState({ errorMessage: null });
  }

  render() {
    return (
      <div>
        {this.state.errorMessage &&
          <div className={commonStyles.errorMessage}>
            {this.state.errorMessage}
          </div>
        }
        <div className={commonStyles.grid}>
          <form
            onSubmit={this.handleSubmit}
            className={commonStyles.form}
          >
            <label className={commonStyles.label}>
              Username
              <input
                className={commonStyles.input}
                type="text"
                name="username"
                value={this.state.username}
                onChange={this.handleUserChange}
              />
            </label>
            <label className={commonStyles.label}>
              Password
              <input
                className={commonStyles.input}
                type="password"
                name="password"
                value={this.state.password}
                onChange={this.handlePasswordChange}
              />
            </label>
            <button
              className={commonStyles.button}
              type="submit"
            >
              Sign in
            </button>
            <a
              className={commonStyles.formLink}
              href="https://plot.ly/accounts/password/reset/"
              onClick={this.onClickForgotPassword}
            >
              Forgot password?
            </a>
          </form>
          <SocialAuthLinks
            domain={"https://plot.ly/login"}
            apiUrl={domainUrl}
            onLoginSuccess={this.onLoginSuccess}
            onLoginError={this.onSocialLoginError}
          />
        </div>
        <div className={commonStyles.signUp}>
          <p className={commonStyles.signUpHeading}>
            Don’t have a Chart Studio Cloud account?
          </p>
          <a href="http://plot.ly" onClick={this.onClickCreateAccount}>
            Create an account now
          </a>
        </div>
      </div>
    );
  }
}

export default PlotlyForm;

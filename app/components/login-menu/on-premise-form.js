import React, { Component, PropTypes } from "react";
import { ipcRenderer } from "electron";

import { login } from "../../api/user";
import { testApiUrl, normalizeDomain } from "../../api/on-premise";
import styles from "./on-premise-form.css";
import commonStyles from "./index.css";
import Spinner from "../../assets/icons/spinner.js";

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
      domain: "",
      validDomain: false,
      username: "",
      password: "",
      errorMessage: null,
      loadingDomain: false
    };
  }

  onLoginSuccess = (userInfo) => {
    this.context.store.api.setDomainUrl(this.state.domain);
    this.context.store.api.setUser(userInfo);
    this.closeModal();
    this.setState({ errorMessage: null });
  }

  onSocialLoginError = (provider) => {
    this.setState({
      errorMessage: `${provider} login failed, please try again`
    });
  }

  onClickForgotPassword = (ev) => {
    ev.preventDefault();

    ipcRenderer.send("open-external", `${this.state.domain}/accounts/password/reset/`);
  }

  onClickCreateAccount = (ev) => {
    ev.preventDefault();

    ipcRenderer.send("open-external", this.state.domain);
  }

  handleDomainChange = (ev) => {
    this.setState({ domain: ev.target.value });
  }

  handleUserChange = (ev) => {
    this.setState({ username: ev.target.value });
  }

  handlePasswordChange = (ev) => {
    this.setState({ password: ev.target.value });
  }

  handleDomainBlur = () => {
    if (!this.state.domain) {
      this.setState({
        validDomain: false
      });

      return;
    }

    this.setState({ loadingDomain: true, validDomain: false });

    testApiUrl(this.state.domain)
      .then(() => {
        this.setState({ loadingDomain: false, validDomain: true });
      })
      .catch(() => {
        this.setState({ loadingDomain: false });
      });
  }

  handleSubmit = (ev) => {
    ev.preventDefault();

    const { validDomain, username, password } = this.state;

    if (!validDomain) {
      this.setState({
        errorMessage: "Uh oh, we couldn’t find that domain. Please try again or <a href='http://help.plot.ly/'>visit our Help Center</a>."
      });

      return;
    }

    if (!username || !password) {
      this.setState({
        errorMessage: "Oops! The username or password was invalid."
      });

      return;
    }

    login(normalizeDomain(this.state.domain), username, password)
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
            style={{
              padding: "0 20px"
            }}
          >
            <label className={commonStyles.label}>
              Enter your team’s plot.ly domain
              <input
                className={commonStyles.input}
                type="text"
                name="domain"
                value={this.state.domain}
                onChange={this.handleDomainChange}
                onBlur={this.handleDomainBlur}
                placeholder="https://plotly.your-company.com"
              />

            {this.state.loadingDomain &&
                <div
                  className={styles.spinner}
                >
                  <Spinner />
                </div>
              }
            {this.state.validDomain &&
              <span
                className={`ion-checkmark ${styles.valid}`}
              >
              </span>
            }
            </label>
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
              disabled={!this.state.validDomain}
            >
              Sign in
            </button>
            <a
              className={commonStyles.formLink}
              href={`${this.state.domain}/accounts/password/reset/`}
              onClick={this.onClickForgotPassword}
            >
              Forgot password?
            </a>
          </form>
        </div>
        <div className={commonStyles.signUp}>
          <p className={commonStyles.signUpHeading}>
            Don’t have a plot.ly account?
          </p>
          <a href="http://plot.ly" onClick={this.onClickCreateAccount}>
            Create an account on plot.ly
          </a>
        </div>
      </div>
    );
  }
}

export default PlotlyForm;

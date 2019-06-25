import React, { Component, PropTypes } from "react";
import { observer } from "mobx-react";

import LoginModal from "./login-modal";
import UserMenu from "./user-menu";
import styles from "./index.css";

@observer
class LoginMenu extends Component {
  static contextTypes = {
    store: PropTypes.object
  };

  constructor(props) {
    super(props);

    this.state = {
      loggedIn: false,
      loginModalVisible: false
    };
  }

  onClickLogin = () => {
    this.setState({ loginModalVisible: true });
  }

  onCloseModal = () => {
    this.setState({ loginModalVisible: false });
  }

  render() {
    const { user } = this.context.store.api;
    const { loginModalVisible } = this.state;

    return (
      <div>
        {user ? <UserMenu user={user} /> :
          <button
            className={styles.signInBtn}
            onClick={this.onClickLogin}
          >
            <i className={"icon ion-person"}></i>
            <p className={styles.signInCopy}>Sign in to Chart Studio</p>
          </button>
        }
        {!user && loginModalVisible && <LoginModal onClose={this.onCloseModal} />}
      </div>
    );
  }
}

export default LoginMenu;

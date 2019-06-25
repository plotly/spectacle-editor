import React, { Component, PropTypes } from "react";
import { observer } from "mobx-react";

import { fetchOne, fetchAll } from "../../api/presentation";
import Spinner from "../../assets/icons/spinner";
import styles from "./user-menu.css";

@observer
class UserMenu extends Component {
  static contextTypes = {
    store: React.PropTypes.object
  };

  static propTypes = {
    user: PropTypes.object.isRequired,
    domain: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      userFlyoutVisible: false,
      loading: true,
      presentationList: null
    };
  }

  onOpenFlyout = () => {
    this.setState({
      userFlyoutVisible: true,
      loading: true
    });

    const { domainUrl, csrfToken } = this.context.store.api;

    fetchAll(domainUrl, csrfToken)
      .then((resJson) => {
        if (resJson.results && resJson.results.length) {
          this.setState({
            presentationList: resJson.results,
            loading: false
          });

          return;
        }

        this.setState({
          loading: false,
          presError: "No presentations uploaded"
        });
      })
      .catch(() => {
        this.setState({
          loading: false,
          presError: "We're sorry, there was a problem fetching your presentations"
        });
      });
  }

  onCloseFlyout = () => {
    this.setState({ userFlyoutVisible: false });
  }

  onClickSignOut = (ev) => {
    ev.preventDefault();

    this.context.store.api.signOut();
  }

  onClickPres(fid, ev) {
    ev.preventDefault();

    if (!fid) {
      return;
    }

    const { domainUrl, csrfToken } = this.context.store.api;

    fetchOne(domainUrl, fid, csrfToken)
      .then((resJson) => {
        if (resJson.content && resJson.fid) {
          const content = JSON.parse(resJson.content);
          this.context.store.deserialize(content.presentation);
          this.context.store.api.setPresentation(resJson);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  renderFlyout(visible) {
    const { user } = this.props;

    if (!visible) {
      return;
    }
    return (
      <div className={styles.flyout}>
        <button className={styles.flyoutBtnClose} onClick={this.onCloseFlyout}>
          <i className={"icon ion-android-close"}></i>
        </button>
        <p className={styles.userName}>{user.username}</p>
        <button className={styles.signOut} onClick={this.onClickSignOut}>
          Sign out
        </button>

        <div className={styles.presentations}>
          <p className={styles.presentationsHeading}>
            <span className={styles.fancy}>Your Chart Studio Presentations</span>
          </p>
          {this.state.loading && <Spinner className={styles.spinner} />}
          {this.state.presError && <h4>{this.state.presError}</h4>}
          {this.state.presentationList &&
            <ul className={styles.list}>
              {this.state.presentationList.map((presObj) => (
                <li className={styles.listItem}>
                  <a href="#"
                    className={styles.presentationLink}
                    onClick={this.onClickPres.bind(this, presObj.fid)}
                  >
                    {presObj.filename}
                  </a>
                </li>
              ))}
            </ul>
          }
        </div>
      </div>
    );
  }

  render() {
    const { user } = this.props;
    const { userFlyoutVisible } = this.state;

    return (
      <div className={styles.userMenu}>
        <p className={styles.userName}>{user.username}</p>
        <button className={styles.flyoutBtn} onClick={this.onOpenFlyout}>
          <img className={styles.userAvatar} alt="" src={user.avatar_url} />
          <i className={`${styles.flyoutBtnIcon} icon ion-ios-arrow-down`} ></i>
        </button>
        {this.renderFlyout(userFlyoutVisible)}
      </div>
    );
  }
}

export default UserMenu;

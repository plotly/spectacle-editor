import React, { Component } from "react";
import { ipcRenderer } from "electron";
import { observer } from "mobx-react";

import { ElementTypes } from "../../../constants";
import elements from "../../../elements";
import { IMAGE } from "../../../assets/icons";
import commonStyles from "../index.css";
import styles from "./image.css";
import notificationSystem from "../../../notifications";

const defaultImageSource = elements[ElementTypes.IMAGE].props.src;

const normalizeUrl = (url) => {
  if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) {
    return url;
  }

  return `http://${url}`;
};

@observer
export default class ImageMenu extends Component {
  static contextTypes = {
    store: React.PropTypes.object
  }

  shouldComponentUpdate() {
    const { store: { currentElement } } = this.context;
    return currentElement && currentElement.type === ElementTypes.IMAGE;
  }

  onImageUpload = (ev) => {
    const imageObj = ev.target.files && ev.target.files[0];

    if (imageObj) {
      const { path, type, name, size } = imageObj;

      if (size <= 3000000) {
        ipcRenderer.once("image-encoded", (event, encodedImageString) => {
          if (!encodedImageString) {
            notificationSystem.addNotification({
              message: "Error loading file",
              level: "error"
            });

            return;
          }

          const imgSrc = `data:${type};base64, ${encodedImageString}`;

          this.getScaledHeightAndWidth(imgSrc, ({ height, width, src }) => {
            this.context.store.updateElementProps({
              src,
              imageName: name,
              height,
              width,
              style: {
                opacity: 1
              }
            });
          });
        });

        ipcRenderer.send("encode-image", path);
      } else {
        notificationSystem.addNotification({
          message: "Error: images must be smaller than 3MB",
          level: "error"
        });
      }
    }
  }

  onSourceChange = (ev) => {
    const imageSrc = ev.target.value;

    if (imageSrc) {
      this.getScaledHeightAndWidth(imageSrc, ({ src, height, width }) => {
        this.context.store.updateElementProps({
          src,
          imageName: null,
          height,
          width,
          style: {
            opacity: 1
          }
        });
      });
    }
  }

  onSourceBlur = (ev) => {
    const imageSrc = ev.target.value;

    if (!imageSrc) {
      return;
    }

    const normalizedUrl = normalizeUrl(imageSrc);

    if (imageSrc !== normalizedUrl) {
      this.context.store.updateElementProps({
        src: normalizedUrl
      });
    }
  }

  getScaledHeightAndWidth(src, cb) {
    const imageElement = new Image();
    imageElement.src = src;

    imageElement.addEventListener("load", () => {
      const { props } = this.context.store.currentElement;
      const { height, width } = imageElement;
      const aspectRatio = Math.min(height, width) / Math.max(height, width);

      cb({
        src,
        height: height > width ? props.height : props.width * aspectRatio,
        width: height < width ? props.width : props.height * aspectRatio,
        aspectRatio
      });
    });
  }

  render() {
    const { store: { currentElement } } = this.context;

    let srcValue = "";
    let fileName = "";

    if (currentElement) {
      const { src, imageName } = currentElement.props;

      // If not the default source or we don't have an imageName show src
      if (src !== defaultImageSource && !imageName) {
        srcValue = src;
      }

      if (imageName) {
        fileName = imageName;
      }
    }

    return (
      <div className={commonStyles.wrapper}>
        <h3 className={commonStyles.heading}>Image</h3>
        <hr className={commonStyles.hr} />
        <p className={commonStyles.subHeading}>
          Image source
        </p>
        <input
          className={`globalInput`}
          type="text"
          name="imagesSource"
          onChange={this.onSourceChange}
          onBlur={this.onSourceBlur}
          value={srcValue}
        />
        <p className={commonStyles.subHeading}>File Upload</p>
        { fileName ?
          <p className={styles.uploadedFile}>
            <span
              className={styles.uploadedFileIcon}
              dangerouslySetInnerHTML={{ __html: IMAGE }}
            >
            </span>
            <span className={styles.uploadedFileName}>
              {fileName}
            </span>
          </p>
          : ""
        }
        <label className={`globalButton ${styles.fileUpload}`}>
          {fileName ?
            `Replace this file...` :
            `Choose a file...`
          }
          <input
            className={styles.visuallyHidden}
            type="file"
            name="imageFile"
            accept="image/x-png, image/gif, image/jpeg"
            onChange={this.onImageUpload}
          />
        </label>
      </div>
    );
  }
}

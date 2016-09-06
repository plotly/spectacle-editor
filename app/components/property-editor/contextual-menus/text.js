import React, { Component } from "react";

import styles from "../index.css";
import { map, omit, find } from "lodash";

import {
  Alignment,
  ColorPicker,
  Formatting,
  Incrementer,
  List,
  LinkTo,
  Option,
  Select,
  UpdateParagraphStyles
} from "../editor-components/index.js";
import { ElementTypes, ParagraphStyles } from "../../../constants";
import { FontMap } from "../../../font-settings";

export default class TextMenu extends Component {
  static contextTypes = {
    store: React.PropTypes.object
  }

  constructor(props) {
    super(props);

    this.state = { currentElement: null };
  }

  shouldComponentUpdate() {
    const { store: { currentElement } } = this.context;
    return currentElement && currentElement.type === ElementTypes.TEXT;
  }

  handleFontFamily = (value, properties) => {
    const { currentElement } = this.context.store;

    if (!currentElement || !properties) {
      return;
    }

    if (properties.style.fontFamily !== currentElement.props.style.fontFamily) {
      this.updateCurrentElementStyles(currentElement, {
        ...properties.style,
        fontWeight: 400,
        fontStyle: "normal"
      });
    }
  }

  handleFontStyles = (value, properties) => {
    const { currentElement } = this.context.store;

    if (properties && currentElement) {
      const { currentWeight, currentStyle } = currentElement.props.style;
      const { fontWeight, fontStyle } = properties.style;

      if (fontWeight !== currentWeight || fontStyle !== currentStyle) {
        this.updateCurrentElementStyles(currentElement, omit(properties.style, "fontFamily"));
      }
    }
  }

  handleColorChange = (hex, opacity) => {
    const style = this.context.store.currentElement.props.style;
    const updatedColor = {};

    if (style.color !== hex) {
      updatedColor.color = hex;
    }

    if (style.opacity !== opacity) {
      updatedColor.opacity = opacity;
    }

    if (updatedColor.opacity === undefined && updatedColor.color === undefined) {
      return;
    }

    const updatedStyles = {
      ...this.context.store.currentElement.props.style,
      ...updatedColor
    };

    this.context.store.updateElementProps({ style: updatedStyles });
  }

  handleParagraphStyle = (value) => {
    const { currentElement } = this.context.store;

    if (value && currentElement) {
      const { paragraphStyle } = currentElement.props;

      if (paragraphStyle !== value) {
        this.context.store.updateElementProps({
          ...currentElement.props,
          paragraphStyle: value,
          style: {}
        });
      }
    }
  }

  updateCurrentElementStyles = (currentElement, style) => {
    const oldStyles = currentElement.props.style;

    this.context.store.updateElementProps({
      style: { ...oldStyles, ...style }
    });
  }

  render() {
    const currentElement = this.context.store.currentElement;
    const { paragraphStyles } = this.context.store;
    const styleProps = currentElement && {
      ...paragraphStyles[currentElement.props.paragraphStyle],
      ...currentElement.props.style
    };

    let currentStyles;

    if (currentElement) {
      currentElement.props.style = styleProps;
      currentStyles = find(FontMap[styleProps.fontFamily].styles, {
        fontWeight: styleProps.fontWeight,
        fontStyle: styleProps.fontStyle
      });
    }

    return (
      <div className={styles.wrapper}>
        {
          currentElement &&
          (
          <div>
            <h3 className={styles.heading}>Text</h3>
            <hr className={styles.hr} />
            <div className={styles.row}>
              <div className={styles.subHeading}>
                Paragraph Styles
              </div>
              <div>
                <Select
                  onChange={this.handleParagraphStyle}
                  selectName="ParagraphStyles"
                  placeholderText={currentElement.props.paragraphStyle}
                  defaultValue={currentElement.props.paragraphStyle}
                  currentOptionClassName={styles.select}
                >
                  {ParagraphStyles.map((heading, i) => (
                    <Option
                      key={i}
                      value={heading}
                    >
                        {heading}
                    </Option>
                    )
                  )}
                </Select>
              </div>
            </div>
            <div>
              <div className={styles.breakHr}>
                <div className={styles.breakTitle}>{currentElement.props.paragraphStyle}</div>
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.subHeading}>
                Font
              </div>
              <div>
                <Select
                  onChange={this.handleFontFamily}
                  selectName="FontType"
                  placeholderText={FontMap[styleProps.fontFamily].name}
                  defaultValue={FontMap[styleProps.fontFamily].name}
                  currentOptionClassName={styles.select}
                >
                  {map(FontMap, (fontObj, fontFamily) => (
                    <Option
                      key={fontFamily}
                      value={fontObj.name}
                      style={{ fontFamily }}
                    >
                        {fontObj.name}
                    </Option>
                    )
                  )}
                </Select>
              </div>
            </div>
            <div className={styles.flexrow}>
              <Select
                onChange={this.handleFontStyles}
                selectName="FontStyle"
                defaultValue={currentStyles && currentStyles.name}
                currentOptionClassName={styles.selectNarrow}
              >
                {map(FontMap[styleProps.fontFamily].styles, (stylesObj, index) => {
                  const cleanedStylesObj = omit(stylesObj, "name");
                  cleanedStylesObj.fontFamily = styleProps.fontFamily;

                  return (
                    <Option
                      key={index}
                      value={stylesObj.name}
                      style={ cleanedStylesObj }
                    >
                      {stylesObj.name}
                    </Option>
                  );
                })}
              </Select>
              <Incrementer
                currentElement={currentElement}
                propertyName={"fontSize"}
              />
            </div>

            <div className={`${styles.flexrow} ${styles.flexspacebetween}`}>
              <div>
                <div className={styles.subHeading}>
                  Color
                </div>
                <ColorPicker currentStyles={styleProps} onChangeColor={this.handleColorChange} />
              </div>
              <div>
                <div className={styles.subHeading}>
                  Formatting
                </div>
                <Formatting currentElement={currentElement} />
              </div>
            </div>

            <div className={styles.rowAlt}>
              <div className={styles.subHeading}>
                Alignment
              </div>
              <Alignment
                currentElement={currentElement}
              />
            </div>
            <div className={styles.rowAlt}>
              <UpdateParagraphStyles
                currentElement={currentElement}
              />
            </div>
            <hr className={`${styles.hr} ${styles.hrList}`} />
            <div className={styles.row}>
              <div className={styles.subHeading}>
                List
              </div>
              <List
                currentElement={currentElement}
              />
            </div>
            <div className={styles.row}>
              <div className={styles.subHeading}>
                Link
              </div>
              <LinkTo currentElement={currentElement} />
            </div>
          </div>
        )}
      </div>
    );
  }
}

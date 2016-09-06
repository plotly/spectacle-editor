import { invert } from "lodash";

import { ElementTypes } from "../constants";

export const getParagraphStyles = (obj) => (
  {
    color: "#3d3d3d",
    fontFamily: "Open Sans",
    fontSize: 45,
    fontStyle: "normal",
    lineHeight: "normal",
    fontWeight: 400,
    minWidth: 20,
    opacity: 1,
    textAlign: "center",
    textDecoration: "none",
    ...obj
  }
);

export const verifyFileContent = (fileContent, cb) => {
  if (!fileContent ||
    !fileContent.presentation ||
    !fileContent.presentation.slides) {
    return cb(new Error("Empty file"));
  }

  if (!Array.isArray(fileContent.presentation.slides)) {
    return cb(new Error("content.slides must be an array"));
  }

  const slideError = fileContent.presentation.slides.some((slide) => {
    if (!slide.id || !slide.children || !slide.props) {
      cb(new Error("Invalid Slide"));

      return true;
    }

    if (!Array.isArray(slide.children)) {
      cb(new Error("Slide children must be an array"));

      return true;
    }

    return slide.children.some((child) => {
      if (!child.type || !invert(ElementTypes)[child.type]) {
        cb(new Error("Slide child must have a valid type"));

        return true;
      }

      if (!child.id || !child.props) {
        cb(new Error("Invalid slide child"));

        return true;
      }

      return false;
    });
  });

  if (!slideError) {
    return cb();
  }
};

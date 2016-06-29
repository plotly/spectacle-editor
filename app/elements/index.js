import React from "react";

// import plotlyPlaceholder from "../assets/images/plotly-placeholder.png";
import { ElementTypes } from "../constants";
import { Image, Heading } from "../spectacle-components";

const elements = {};

/*
* TODO: define style properties exposed to user
*
* It may be useful to add something like `userProps` to each element that
* defines which props are actually exposed to the user through the ui.
*
* Could be an array:
*
* userProps: ['size', 'font']
*
* Could be objects that provide more useful metadata & input rendering components:
*
* userProps: {
*   size: {
*     type: 'number',
*     ComponentClass: NumberInput
*   },
*   color: {
*     type: 'color',
*     ComponentClass: ColorInput
*   }
* }
*/

elements[ElementTypes.TEXT] = {
  // Keep type for serialization and code switches
  // TODO: Figure out defaults for text element
  type: ElementTypes.TEXT,
  ComponentClass: Heading,
  defaultWidth: 222,
  defaultHeight: 63,
  props: {
    size: 4,
    style: {
      color: "#3d3d3d",
      fontFamily: "openSans",
      fontSize: 45,
      fontWeight: 400,
      fontStyle: "normal",
      textAlign: "center"
    }
  },
  children: "totally text"
};

elements[ElementTypes.IMAGE] = {
  type: ElementTypes.IMAGE,
  ComponentClass: Image,
  props: {
    src: "http://placehold.it/400x200&text=sliding_yeah",
    width: 400,
    height: 200
  },
  children: []
};

elements[ElementTypes.PLOTLY] = {
  type: ElementTypes.PLOTLY,
  ComponentClass: (props) => (<iframe {...props} />),
  props: {
    src: "https://plot.ly/~rgerstenberger/0.embed",
    width: 450,
    height: 400,
    frameBorder: 0,
    scrolling: "no"
  },
  children: []
};

elements[ElementTypes.PLOTY_PLACEHOLDER_IMAGE] = {
  // Values calculated at scale: 1
  type: ElementTypes.PLOTY_PLACEHOLDER_IMAGE,
  ComponentClass: Image,
  props: {
    src: "plotlyPlaceholder",
    width: 450,
    height: 400
  },
  children: []
};


elements[ElementTypes.CODE] = {
  type: ElementTypes.CODE,
  ComponentClass: Image,
  props: {
    src: "http://placehold.it/400x200&text=sliding_yeah",
    width: 400,
    height: 200
  },
  children: []
};


export default elements;

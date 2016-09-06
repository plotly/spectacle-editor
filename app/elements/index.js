import React from "react";

import plotlyPlaceholder from "../assets/images/plotly-placeholder.png";
import imagePlaceholder from "../assets/icons/image.svg";
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
  defaultWidth: 51,
  defaultHeight: 36,
  defaultText: ["Text"],
  resizeVertical: false,
  props: {
    paragraphStyle: "Heading 1",
    isQuote: false,
    size: 4,
    listType: null,
    style: {}
  },
  children: null
};

elements[ElementTypes.IMAGE] = {
  type: ElementTypes.IMAGE,
  ComponentClass: Image,
  props: {
    src: `data:image/svg+xml;utf8,${imagePlaceholder}`,
    style: {
      width: 281,
      height: 200,
      opacity: 0.2
    }
  },
  children: []
};

elements[ElementTypes.PLOTLY] = {
  type: ElementTypes.PLOTLY,
  ComponentClass: (props) => (<iframe {...props} style={{}} />),
  props: {
    src: "https://plot.ly/~rgerstenberger/0.embed?link=false",
    frameBorder: 0,
    scrolling: "no",
    style: {
      width: 450,
      height: 400
    }

  },
  children: []
};

elements[ElementTypes.PLOTY_PLACEHOLDER_IMAGE] = {
  // Values calculated at scale: 1
  type: ElementTypes.PLOTY_PLACEHOLDER_IMAGE,
  ComponentClass: Image,
  props: {
    src: plotlyPlaceholder,
    style: {
      width: 450,
      height: 400
    }
  },
  children: []
};


elements[ElementTypes.CODE] = {
  type: ElementTypes.CODE,
  ComponentClass: Image,
  props: {
    src: "http://placehold.it/400x200&text=sliding_yeah",
    style: {
      width: 400,
      height: 200
    }
  },
  children: []
};


export default elements;

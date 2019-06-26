export const DraggableTypes = {
  UI_ELEMENT: "UI_ELEMENT"
};

// TODO: Revise list?
export const ElementTypes = {
  HEADING: "Heading",
  TEXT: "Text",
  LIST: "List",
  LINK: "Link",
  IMAGE: "Image",
  PLOTLY: "Plotly",
  PLOTY_PLACEHOLDER_IMAGE: "Plotly Placeholder",
  CODE: "CodePane",
  QUOTE: "Quote",
  TABLE: "Table",
  IFRAME: "IFrame"
};

export const IconTypes = {
  ...ElementTypes
};

export const ParagraphStyles = [
  "Heading 1",
  "Heading 2",
  "Heading 3",
  "Body",
  "Body Small",
  "Caption"
];

export const SpringSettings = {
  DRAG: { stiffness: 1000, damping: 50 },
  RESIZE: { stiffness: 210, damping: 20 }
};

export const SNAP_DISTANCE = 15;
export const BLACKLIST_CURRENT_ELEMENT_DESELECT = "ignoreElementDeselect";

export const MODES = {
  TOP_LEFT: "TOP_LEFT",
  TOP: "TOP",
  TOP_RIGHT: "TOP_RIGHT",
  RIGHT: "RIGHT",
  BOTTOM_RIGHT: "BOTTOM_RIGHT",
  BOTTOM: "BOTTOM",
  BOTTOM_LEFT: "BOTTOM_LEFT",
  LEFT: "LEFT",
  MOVE: "MOVE"
};

export const CodeLanguages = {
  cpp: "C/C++",
  cs: "C#",
  css: "CSS",
  fsharp: "F#",
  go: "Go",
  haskell: "Haskell",
  java: "Java",
  javascript: "JavaScript",
  jsx: "JSX",
  julia: "Julia",
  xml: "XML/HTML",
  matlab: "MATLAB",
  php: "PHP",
  python: "Python",
  r: "R",
  ruby: "Ruby",
  scala: "Scala",
  sql: "SQL",
  yaml: "YAML"
};

export const CodeThemes = {
  tomorrowNight: "Dark",
  tomorrow: "Light"
};

export const FontTypes = {
  thin: {
    name: "Thin",
    fontWeight: 100,
    fontStyle: "normal"
  },
  thinItalic: {
    name: "Thin Italic",
    fontWeight: 100,
    fontStyle: "italic"
  },
  extraLight: {
    name: "Extra Light",
    fontWeight: 200,
    fontStyle: "normal"
  },
  extraLightItalic: {
    name: "Extra Light Italic",
    fontWeight: 200,
    fontStyle: "italic"
  },
  light: {
    name: "Light",
    fontWeight: 300,
    fontStyle: "normal"
  },
  lightItalic: {
    name: "Light Italic",
    fontWeight: 300,
    fontStyle: "italic"
  },
  regular: {
    name: "Regular",
    fontWeight: 400,
    fontStyle: "normal"
  },
  italic: {
    name: "Regular Italic",
    fontWeight: 400,
    fontStyle: "italic"
  },
  medium: {
    name: "Medium",
    fontWeight: 500,
    fontStyle: "normal"
  },
  mediumItalic: {
    name: "Medium Italic",
    fontWeight: 500,
    fontStyle: "italic"
  },
  semiBold: {
    name: "Semi-Bold",
    fontWeight: 600,
    fontStyle: "normal"
  },
  semiBoldItalic: {
    name: "Semi-Bold Italic",
    fontWeight: 600,
    fontStyle: "italic"
  },
  bold: {
    name: "Bold",
    fontWeight: 700,
    fontStyle: "normal"
  },
  boldItalic: {
    name: "Bold Italic",
    fontWeight: 700,
    fontStyle: "italic"
  },
  extraBold: {
    name: "Extra Bold",
    fontWeight: 800,
    fontStyle: "normal"
  },
  extraBoldItalic: {
    name: "Extra Bold Italic",
    fontWeight: 800,
    fontStyle: "italic"
  },
  black: {
    name: "Black",
    fontWeight: 900,
    fontStyle: "normal"
  },
  blackItalic: {
    name: "Black Italic",
    fontWeight: 900,
    fontStyle: "italic"
  }
};

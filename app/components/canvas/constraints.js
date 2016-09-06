/* eslint-disable max-len */
import { MODES, SNAP_DISTANCE } from "../../constants";

const isVerticalResize = (mode) => (
  mode !== MODES.LEFT &&
  mode !== MODES.RIGHT &&
  mode !== MODES.MOVE
);
const isLeftSideResize = (mode) => (
  mode === MODES.LEFT ||
  mode === MODES.TOP_LEFT ||
  mode === MODES.BOTTOM_LEFT
);
const isRightSideResize = (mode) => (
  mode === MODES.RIGHT ||
  mode === MODES.TOP_RIGHT ||
  mode === MODES.BOTTOM_RIGHT
);
const isTopResize = (mode) => (
  mode === MODES.TOP ||
  mode === MODES.TOP_LEFT ||
  mode === MODES.TOP_RIGHT
);
const isBottomResize = (mode) => (
  mode === MODES.BOTTOM ||
  mode === MODES.BOTTOM_LEFT ||
  mode === MODES.BOTTOM_RIGHT
);
const isHorizontalResize = (mode) => (
  mode !== MODES.TOP &&
  mode !== MODES.BOTTOM &&
  mode !== MODES.MOVE
);

const resolveAdjustments = (targetSize, constrainedSize, mode) => {
  const resolved = { ...constrainedSize };

  if (isTopResize(mode) || mode === MODES.MOVE) {
    resolved.top -= constrainedSize.height - targetSize.height;
    // if we're not dragging and our top has been constrained, add to height
    if (mode !== MODES.MOVE && targetSize.top !== constrainedSize.top) {
      resolved.height += targetSize.top - constrainedSize.top;
    }
  }

  if (isBottomResize(mode)) {
    resolved.height += constrainedSize.top - targetSize.top;
    // if our top has been constrained during bottom resize, undo it
    if (targetSize.top !== constrainedSize.top) {
      resolved.top = targetSize.top;
    }
  }

  if (isLeftSideResize(mode) || mode === MODES.MOVE) {
    resolved.left -= constrainedSize.width - targetSize.width;
    // if we're not dragging and our left side has been constrained, add to width
    if (mode !== MODES.MOVE && targetSize.left !== constrainedSize.left) {
      resolved.width += targetSize.left - constrainedSize.left;
    }
  }

  if (isRightSideResize(mode)) {
    resolved.width += constrainedSize.left - targetSize.left;
    // if our left has been constrained during a right side resize, undo it
    if (targetSize.left !== constrainedSize.left) {
      resolved.left = targetSize.left;
    }
  }

  return resolved;
};


export const constrainWidthHeight = (nextSize, minWidth, minHeight, mode) => {
  const constrained = { ...nextSize };
  constrained.width = Math.max(minWidth, nextSize.width);
  constrained.height = Math.max(minHeight, nextSize.height);
  return resolveAdjustments(nextSize, constrained, mode);
};

export const constrainCanvasBounds = (nextSize, canvasWidth, canvasHeight, mode) => {
  const padding = 20;
  const constrained = { ...nextSize };

  // Prevent leaving bottom
  if (constrained.top + padding > canvasHeight) {
    constrained.top = canvasHeight - padding;
  }
  // Prevent leaving right
  if (constrained.left + padding > canvasWidth) {
    constrained.left = canvasWidth - padding;
  }
  // Prevent leaving top
  if (constrained.top + constrained.height - padding < 0) {
    constrained.top = -constrained.height + padding;
  }
  // Prevent leaving left
  if (constrained.left + constrained.width - padding < 0) {
    constrained.left = -constrained.width + padding;
  }

  return resolveAdjustments(nextSize, constrained, mode);
};

export const rectToSnapLines = (rect, mode) => {
  const lines = [];

  // Depending on the mode/direction of the drag, determine what lines to use for snapping
  if (!mode || mode === MODES.MOVE || isLeftSideResize(mode)) {
    const verticalLeft = [rect.left, 1, SNAP_DISTANCE];
    lines.push(verticalLeft);
  }
  if (!mode || mode === MODES.MOVE || isHorizontalResize(mode)) {
    const verticalMid = [rect.left + rect.width / 2, 1, SNAP_DISTANCE / 2];
    lines.push(verticalMid);
  }
  if (!mode || mode === MODES.MOVE || isRightSideResize(mode)) {
    const verticalRight = [rect.left + rect.width, 1, SNAP_DISTANCE];
    lines.push(verticalRight);
  }
  if (!mode || mode === MODES.MOVE || isTopResize(mode)) {
    const horizontalTop = [rect.top, 0, SNAP_DISTANCE];
    lines.push(horizontalTop);
  }
  if (!mode || mode === MODES.MOVE || isVerticalResize(mode)) {
    const horizontalMid = [rect.top + rect.height / 2, 0, SNAP_DISTANCE / 2];
    lines.push(horizontalMid);
  }
  if (!mode || mode === MODES.MOVE || isBottomResize(mode)) {
    const horizontalBottom = [rect.top + rect.height, 0, SNAP_DISTANCE];
    lines.push(horizontalBottom);
  }

  return lines;
};

export const rectsToSnapLines = (rects) => {
  let snaps = [];
  rects.forEach((rect) => {
    snaps = snaps.concat(rectToSnapLines(rect));
  });
  return snaps;
};

function getDifference(a, b) {
  return Math.abs(a - b);
}

export const getClosestSnapLines = (snaps, itemSnapLines) => {
  let closestHorizontal = null;
  let closestVertical = null;

  for (let i = 0; i < snaps.length; i++) {
    const s1 = snaps[i];
    for (let x = 0; x < itemSnapLines.length; x++) {
      const s2 = itemSnapLines[x];
      if (s1[1] === s2[1]) {
        const distance = getDifference(s1[0], s2[0]);
        if (distance < s2[2]) {
          if (s1[1] === 0 && (!closestHorizontal || closestHorizontal.distance > distance)) {
            closestHorizontal = {
              line: s1,
              edge: s2,
              distance: distance * (SNAP_DISTANCE / s2[2])
            };
          } else if (s1[1] === 1 && (!closestVertical || closestVertical.distance > distance)) {
            closestVertical = {
              line: s1,
              edge: s2,
              distance: distance * (SNAP_DISTANCE / s2[2])
            };
          }
        }
      }
    }
  }

  return {
    horizontal: closestHorizontal,
    vertical: closestVertical
  };
};

export const constrainRatio = (originalSize, nextSize, snapResults, mode) => {
  const constrained = { ...nextSize };
  const ratio = originalSize.width / originalSize.height;

  const isVert = isVerticalResize(mode);
  const isHor = isHorizontalResize(mode);

  if ((isHor && !isVert) || (isVert && !snapResults.horizontal || (snapResults.vertical && snapResults.horizontall && snapResults.vertical.distance < snapResults.horizontal.distance))) {
    constrained.height = nextSize.width / ratio;
  } else {
    constrained.width = nextSize.height * ratio;
  }

  const size = resolveAdjustments(nextSize, constrained, mode);
  return size;
};

export const constrainGrid = (nextSize, snapLines, mode) => {
  const constrained = { ...nextSize };
  const itemSnapLines = rectToSnapLines(constrained, mode);
  const closest = getClosestSnapLines(snapLines, itemSnapLines);
  const lines = [];
  let dy = 0;
  let dx = 0;

  if (closest.horizontal) {
    dy = closest.horizontal.line[0] - closest.horizontal.edge[0];
    // if we're not dragging and we're on a mid point, we need to double the delta.
    if (mode !== MODES.MOVE && (closest.horizontal.edge[0] !== constrained.top && closest.horizontal.edge[0] !== constrained.height + constrained.top)) {
      dy *= 2;
    }
    lines.push(closest.horizontal.line);
  }

  if (closest.vertical) {
    dx = closest.vertical.line[0] - closest.vertical.edge[0];
    // if we're not dragging and we're on a mid point, we need to double the delta.
    if (mode !== MODES.MOVE && (closest.vertical.edge[0] !== constrained.left && closest.vertical.edge[0] !== constrained.width + constrained.left)) {
      dx *= 2;
    }
    lines.push(closest.vertical.line);
  }

  constrained.top += dy;
  constrained.left += dx;

  const size = resolveAdjustments(nextSize, constrained, mode);

  return {
    size,
    closest,
    lines
  };
};

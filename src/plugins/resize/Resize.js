import {
  getEventPosition,
  mouseDown,
  mouseMove,
  mouseUp,
} from "../../util/Util";
import "./Resize.css";

const MOUSE_DOWN = mouseDown("imagerjsResize");
const MOUSE_UP = mouseUp("imagerjsResize");
const MOUSE_MOVE = mouseMove("imagerjsResize");

/**
 * Resize plugin. Provides a control which allows to to resize an image.
 *
 * @param imagerInstance
 *
 * @param options {Object} Resize square control options.
 * @param options.controlsCss {Object} Css properties that will be applied to
 * resizing controls.
 *
 * @param options.controlsTouchCss {Object} Css properties that will
 * be applied to resizing controls when on touch device.
 *
 * @param options.doubleDiff {Boolean} Doubles mouse pointer distance.
 * This is needed when image is centered while resizing to make
 * resize corner be always under mouse cursor.
 *
 * @constructor
 * @memberof ImagerJs.plugins
 */
export default class ResizePlugin {
  /**
   *
   * @param {import('../../ImagerJs').default} imagerInstance
   * @param {*} options
   */
  constructor(imagerInstance, options) {
    this.imager = imagerInstance;

    this.defaultOptions = {
      minWidth: 50,
      minHeight: 50,
      aspectRatio: null,
      controlsCss: {
        width: "-20px",
        height: "-20px",
      },
      controlsTouchCss: {},
      doubleDiff: false,
    };

    options = options ? options : {};
    this.options = $.extend(true, this.defaultOptions, options);

    this.weight = 99999;
  }

  onToolSelected() {
    if (this.$resizeSquare) {
      this.$resizeSquare.addClass("hidden");
    }
  }

  onToolApply() {
    if (this.$resizeSquare) {
      this.$resizeSquare.removeClass("hidden");
    }
  }

  onToolReject() {
    if (this.$resizeSquare) {
      this.$resizeSquare.removeClass("hidden");
    }
  }

  onEditStart() {
    var $resizeSquare = $('<div class="resize-square"></div>');

    if (this.imager.touchDevice) {
      $resizeSquare.css(this.options.controlsTouchCss);
    } else {
      const { height, width } = this.options.controlsCss;
      $resizeSquare.css({
        ...this.options.controlsCss,
        right: "-" + width,
        bottom: "-" + height,
      });
    }

    this.imager.$editContainer.append($resizeSquare);

    const $body = $("body");

    const update = () => {
      const box = this.imager.canvas.getBoundingClientRect();
      $resizeSquare.css({
        left: box.x + box.width,
        top: box.y + box.height,
      });

      return box;
    };

    update();

    this.imager.on("historyChange", update);

    $resizeSquare.on(MOUSE_DOWN, (downEvent) => {
      const start = update();

      $body.on(MOUSE_MOVE, (moveEvent) => {
        let { left, top } = getEventPosition(moveEvent);

        let [nw, nh] = [left - start.x, top - start.y];
        const [minW, minH] = [
          this.imager.options.minWidth || 100,
          this.imager.options.minHeight || 100,
        ];

        if (nw < minW) {
          nw = minW;
          left = start.x + minW;
        }

        if (nh < minH) {
          nh = minH;
          top = start.y + minH;
        }

        $resizeSquare.css({ left, top });
        this.imager.setPreviewSize(nw, nh);

        moveEvent.stopPropagation();
        moveEvent.preventDefault();
        return false;
      });

      $body.on(MOUSE_UP, (upEvent) => {
        $body.off(MOUSE_UP);
        $body.off(MOUSE_MOVE);
        this.imager.commitChanges("Resize");
      });

      downEvent.stopPropagation();
      downEvent.preventDefault();
      return false;
    });

    this.$resizeSquare = $resizeSquare;
  }

  /**
   * Conserve aspect ratio of the orignal region.
   * Useful when shrinking/enlarging
   * images to fit into a certain area.
   *
   * @param {Number} srcWidth Source area width
   * @param {Number} srcHeight Source area height
   * @param {Number} maxWidth Fittable area maximum available width
   * @param {Number} maxHeight Fittable area maximum available height
   * @return {Object} { width, heigth }
   */
  calcAspectRatio(srcWidth, srcHeight, maxWidth, maxHeight) {
    var ratio =
      this.options.aspectRatio ||
      Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

    return { width: srcWidth * ratio, height: srcHeight * ratio };
  }
}

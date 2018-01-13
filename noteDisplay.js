/**
 * Displays notes from a note sequence in a canvas.
 */
export class NoteDisplay {
    /**
     * Creates a new NoteDisplay.
     *
     * @param noteSurface The element within which the notes should be created.
     * @param noteSequence The sequence of notes to be displayed.
     * @param xSize The size used to represent 1 beat when drawing, in pixels.
     * @param ySize The size used to represent 1 unit of pitch when drawing, in
     *        pixels.
     */
    constructor({noteSurface, noteSequence, xSize=40, ySize=20}) {
        this.surface = noteSurface;
        this.surface.style.position = 'relative';
        this.addSurfaceListeners();
        this.sequence = noteSequence;
        this.xSize = xSize;
        this.ySize = ySize;
        this.blocks = new Map();
        this.notes = new Map();
        this.converter = new LinearScaler({
            'beat': {
                'zero': 40,
                'scaling': 40
            },
            'pitch': {
                'zero': 400,
                'scaling': -20
            }
        });
    }

    /**
     * Adds the drag-and-drop listeners to the surface.
     */
    addSurfaceListeners() {
        let s = this.surface;
        s.addEventListener('dragenter', this.dragOverListener, false);
        s.addEventListener('dragover', this.dragOverListener, false);
        s.addEventListener('drop', this.dropListener.bind(this), false);
    }

    /**
     * Draws the notes onscreen.
     */
    drawNotes() {
        let notes = this.sequence.getNotes({startBeat: 0, endBeat: 8});

        for (let note of notes) {
            let startPosition = this.converter.outputValuesFor({
                beat: note.start,
                pitch: note.number
            });
            let endPosition = this.converter.outputValuesFor({
                beat: note.start + note.length,
                pitch: note.number + 1
            });
            let block = new NoteBlock({
                top: startPosition.pitch,
                left: startPosition.beat,
                height: Math.abs(endPosition.pitch - startPosition.pitch),
                width: Math.abs(endPosition.beat - startPosition.beat),
                unit: 'px',
            });
            this.blocks.set(block.id, block);
            this.notes.set(block.id, note);
            block.displayOn(this.surface);
        }
    }

    dragOverListener(event) {
        if ([...event.dataTransfer.types].includes('application/note-id')) {
            event.preventDefault();
        }
    }

    dropListener(event) {
        let blockId = Number(event.dataTransfer.getData('application/note-id'));
        this.sequence.moveNote({
            note: this.notes.get(blockId),
            newStart: this.converter
                .inputValuesFor({'beat': event.clientX})
                .beat
        });
    }
}

/**
 * Converts units using linear relationships.
 *
 * @param units An object where each property describes a unit to provide
 *            scaling for.
 */
class LinearScaler {
    constructor(units) {
        this.units = units;
    }

    /**
     * Calculates the output values for a set of input values.
     */
    outputValuesFor(inputValues) {
        let outputValues = {};

        for (let unit in inputValues) {
            if (this.units[unit] != undefined) {
                outputValues[unit] = this.units[unit].zero
                    + this.units[unit].scaling * inputValues[unit];
            }
        }

        return outputValues;
    }

    /**
     * Calculates the input values for a set of output values.
     */
    inputValuesFor(outputValues) {
        let inputValues = {};

        for (let unit in outputValues) {
            if (this.units[unit] != undefined) {
                inputValues[unit] = (outputValues[unit] - this.units[unit].zero)
                    / this.units[unit].scaling;
            }
        }

        return inputValues;
    }
}

/**
 * A block representing a note in a note sequence.
 */
class NoteBlock {
    /**
     * Creates a new note block for a specific note.
     *
     * @param top The “top” value the block’s DOM element should have.
     * @param left The “left” value the block’s DOM element should have.
     * @param height The “height” value the block’s DOM element should have.
     * @param width The “width” value the block’s DOM element should have.
     * @param unit The unit the block’s DOM element should use, e.g. "px" or
     *        "em".
     */
    constructor({top, left, height, width, unit}) {
        this.id = NoteBlock.nextId();

        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.element.style.height = height + unit;
        this.element.style.width = width + unit;
        this.element.style.left = left + unit;
        this.element.style.top = top + unit;
        this.element.style.background = 'blue';

        this.element.setAttribute('draggable', 'true');
        this.element.addEventListener(
            'dragstart',
            this.dragListener.bind(this),
            false
        );
    }

    /**
     * Displays the block on a surface.
     */
    displayOn(surface) {
        surface.appendChild(this.element);
    }

    dragListener(e) {
        e.dataTransfer.setData('application/note-id', this.id)
    }
}

/**
 * Generates ids for the noteblocks.
 */
NoteBlock.idGenerator = function*() {
    let i = 0;
    while (true) {
        yield i;
        i++;
    }
}();

/**
 * Returns the next noteblock id.
 */
NoteBlock.nextId = function() {
    return NoteBlock.idGenerator.next().value;
};

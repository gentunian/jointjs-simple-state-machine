import * as joint from 'jointjs';

/**
 * Needed when extendin jointjs shapes.
 */
declare module 'jointjs' {
    namespace shapes {
        namespace custom {
            class Task extends joint.dia.Element {}
            class TaskView extends joint.dia.ElementView {}
        }
    }
}

/**
 * Task Element defined via `custom.Task` namespace.
 */
const Task = joint.dia.Element.define('custom.Task', {
    size: { width: 150, height: 50 },
    attrs: {
        fields: {
            name: "AR",
            state: "done"
        },
        placeholder: {
            refWidth: '100%',
            refHeight: '100%',
            fill: 'transparent',
            stroke: '#D4D4D4'
        }
    }
}, {
    markup: [{
        tagName: 'rect',
        selector: 'placeholder'
    }],
    htmlMarkup: [{
        tagName: 'div',
        className: 'html-element',
        selector: 'htmlRoot',
        groupSelector: 'field',
        style: {
            'position': 'absolute',
            'pointer-events': 'none',
            'user-select': 'none',
            'box-sizing': 'border-box'
        },
        attributes: {
            'data-attribute': 'state'
        },
        children: [{
            tagName: 'label',
            className: 'html-element-header',
            groupSelector: 'field',
            attributes: {
                'data-attribute': 'name'
            }
        }]
    }]
});

/**
 * How Task custom element should be rendered.
 */
class TaskView extends joint.dia.ElementView {
    html: any = null;
    fields: any = [];

    onRender() {
        this.removeHTMLMarkup();
        this.renderHTMLMarkup();
    }

    update(element: joint.dia.Element, opts: any): any {
        if (element) {
            this.updateFields()
        }
        return super.update(element, opts)
    }

    updateTools(a: any): any {
        this.updateHTML()
        return super.updateTools(a)
    }

    renderHTMLMarkup() {
        // @ts-ignore
        const doc = joint.util.parseDOMJSON(this.model.htmlMarkup, "http://www.w3.org/1999/xhtml");
        const html = doc.selectors.htmlRoot;
        const fields = doc.groupSelectors.field
        this.paper.$el.children(":last-child").append(doc.fragment)
        this.html = html;
        this.fields = fields;
        this.updateHTML()
        this.updateFields();
    }

    removeHTMLMarkup() {
        const html = this.html;
        if (!html) return;
        this.paper.$el.find("div:last-child > *").remove();
        this.html = null;
    }

    updateHTML() {
        const bbox = this.model.getBBox();
        const html = this.html;
        html.style.width = bbox.width + 'px';
        html.style.height = bbox.height + 'px';
        html.style.left = bbox.x + 'px';
        html.style.top = bbox.y + 'px';
        this.paper.$el.children(":last-child").css("transform", this.getTransformMatrix());
    }

    updateFields() {
        this.fields.forEach((field: any) => {
            const attribute = field.dataset.attribute;
            const value = this.model.prop(['attrs', 'fields', attribute]);
            switch (field.tagName.toUpperCase()) {
                case 'LABEL':
                    field.textContent = value;
                    break;
                case 'DIV':
                    field.dataset[attribute] = value;
                    break;
            }
        });
    }

    onRemove() {
        this.removeHTMLMarkup();
    }

    private getTransformMatrix(): string {
        const m = this.paper.matrix();
        return `matrix(${m.a}, ${m.b}, ${m.c}, ${m.d}, ${m.e}, ${m.f})`;
    }
}

(<any>Object).assign(joint.shapes, {
    custom: {
        Task,
        TaskView
    }
});
"use client";

import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChangeEventHandler,
  KeyboardEvent,
  OptionHTMLAttributes,
  ReactElement,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/helpers";

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "multiple" | "size"> & { label?: string };
type Choice = { key: string; value: string; label: string; content: ReactNode; disabled: boolean };
type OptionElement = ReactElement<OptionHTMLAttributes<HTMLOptionElement>>;

function textContent(node: ReactNode): string {
  return Children.toArray(node).map((part) => {
    if (typeof part === "string" || typeof part === "number") return String(part);
    if (isValidElement<{ children?: ReactNode }>(part)) return textContent(part.props.children);
    return "";
  }).join("");
}

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { className, label, children, value, defaultValue, name, id, required, disabled, onChange, onInvalid, "aria-label": ariaLabel, "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid, ...nativeProps },
  forwardedRef,
) {
  const generatedId = useId();
  const controlId = id ?? `select-${generatedId}`;
  const labelId = `${controlId}-label`;
  const listboxId = `${controlId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const nativeRef = useRef<HTMLSelectElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [uncontrolledValue, setUncontrolledValue] = useState(() => String(defaultValue ?? ""));
  const [typeahead, setTypeahead] = useState("");
  const typeaheadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const choices = useMemo<Choice[]>(() => Children.toArray(children).flatMap((child) => {
    if (!isValidElement<OptionHTMLAttributes<HTMLOptionElement>>(child) || child.type !== "option") return [];
    const option = child as OptionElement;
    const optionValue = String(option.props.value ?? textContent(option.props.children));
    return [{
      key: String(option.key ?? optionValue),
      value: optionValue,
      label: option.props.label ?? textContent(option.props.children),
      content: option.props.children,
      disabled: Boolean(option.props.disabled),
    }];
  }), [children]);

  const selectedValue = value === undefined ? uncontrolledValue : String(value);
  const selectedIndex = choices.findIndex((choice) => choice.value === selectedValue);
  const selectedChoice = selectedIndex >= 0 ? choices[selectedIndex] : undefined;
  const setNativeRef = useCallback((element: HTMLSelectElement | null) => {
    nativeRef.current = element;
    if (typeof forwardedRef === "function") forwardedRef(element);
    else if (forwardedRef) forwardedRef.current = element;
  }, [forwardedRef]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    window.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => window.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  useEffect(() => () => {
    if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
  }, []);

  const enabledIndex = (start: number, direction: 1 | -1) => {
    if (!choices.length) return -1;
    let index = start < 0 ? (direction === 1 ? 0 : choices.length - 1) : (start + choices.length) % choices.length;
    for (let count = 0; count < choices.length; count += 1) {
      if (!choices[index].disabled) return index;
      index = (index + direction + choices.length) % choices.length;
    }
    return -1;
  };

  const showMenu = (index = selectedIndex >= 0 ? selectedIndex : enabledIndex(0, 1)) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const choose = (choice: Choice) => {
    if (choice.disabled || disabled) return;
    if (value === undefined) setUncontrolledValue(choice.value);
    const nativeSelect = nativeRef.current;
    if (nativeSelect) {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
      valueSetter?.call(nativeSelect, choice.value);
      nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      if (!open) showMenu(direction === 1 ? enabledIndex(selectedIndex, 1) : enabledIndex(selectedIndex, -1));
      else setActiveIndex((current) => enabledIndex(current + direction, direction));
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const direction = event.key === "Home" ? 1 : -1;
      const start = direction === 1 ? 0 : choices.length - 1;
      setActiveIndex(enabledIndex(start, direction));
      setOpen(true);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) showMenu();
      else if (choices[activeIndex]) choose(choices[activeIndex]);
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      const nextQuery = `${typeahead}${event.key}`.toLocaleLowerCase();
      setTypeahead(nextQuery);
      if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
      typeaheadTimer.current = setTimeout(() => setTypeahead(""), 700);
      const start = enabledIndex(selectedIndex + 1, 1);
      const ordered = [...choices.slice(Math.max(0, start)), ...choices.slice(0, Math.max(0, start))];
      const match = ordered.find((choice) => !choice.disabled && choice.label.toLocaleLowerCase().startsWith(nextQuery));
      if (match) {
        const index = choices.indexOf(match);
        setActiveIndex(index);
        setOpen(true);
      }
    }
  };

  const handleNativeChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    if (value === undefined) setUncontrolledValue(event.currentTarget.value);
    onChange?.(event);
  };

  return (
    <div ref={rootRef} className="select-field">
      {label && <label id={labelId} htmlFor={`${controlId}-trigger`} className="field-label">{label}{required && <span aria-hidden="true" className="required-mark"> *</span>}</label>}
      <div className="select-control-wrap">
        <button
          ref={triggerRef}
          id={`${controlId}-trigger`}
          type="button"
          role="combobox"
          className={cn("field-control select-trigger", open && "select-trigger-open", className)}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-labelledby={label ? labelId : undefined}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          aria-required={required}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open && choices[activeIndex] ? `${controlId}-option-${activeIndex}` : undefined}
          onClick={() => open ? setOpen(false) : showMenu()}
          onKeyDown={handleKeyDown}
        >
          <span className={cn("select-value", !selectedChoice && "select-placeholder")}>
            {selectedChoice?.content ?? choices[0]?.content ?? "Select an option"}
          </span>
          <ChevronDown className={cn("select-chevron", open && "select-chevron-open")} size={17} aria-hidden="true" />
        </button>
        {open && (
          <div id={listboxId} role="listbox" aria-labelledby={label ? labelId : undefined} className="select-menu">
            {choices.map((choice, index) => (
              <button
                key={choice.key}
                id={`${controlId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={choice.value === selectedValue}
                aria-disabled={choice.disabled || undefined}
                className={cn("select-option", index === activeIndex && "select-option-active", choice.value === selectedValue && "select-option-selected")}
                disabled={choice.disabled}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(choice)}
              >
                <span>{choice.content}</span>
                {choice.value === selectedValue && <Check size={16} aria-hidden="true" />}
              </button>
            ))}
          </div>
        )}
        <select
          {...nativeProps}
          ref={setNativeRef}
          id={`${controlId}-native`}
          name={name}
          value={selectedValue}
          required={required}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="select-native"
          onChange={handleNativeChange}
          onInvalid={(event) => {
            onInvalid?.(event);
            triggerRef.current?.focus();
            showMenu();
          }}
        >
          {children}
        </select>
      </div>
    </div>
  );
});

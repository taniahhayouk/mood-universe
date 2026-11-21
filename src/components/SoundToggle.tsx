interface SoundToggleProps {
  on: boolean;
  onToggle: () => void;
}

export function SoundToggle({ on, onToggle }: SoundToggleProps) {
  return (
    <button
      type="button"
      className={`sound-btn${on ? " is-on" : ""}`}
      aria-pressed={on}
      aria-label={on ? "Mute ambient sound" : "Play ambient sound"}
      onClick={onToggle}
    >
      <span aria-hidden="true">{on ? "♫" : "♩"}</span>
      {on ? "Mute" : "Sound"}
    </button>
  );
}

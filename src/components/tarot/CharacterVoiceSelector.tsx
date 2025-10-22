/**
 * CharacterVoiceSelector Component
 * Allows users to select character voice for story audio playback
 */

interface CharacterVoiceSelectorProps {
  characters: string[]
  selectedCharacter?: string
  onSelect: (characterKey: string) => void
}

/**
 * Format character key to display name
 * Example: "brotherhood_scribe" -> "Brotherhood Scribe"
 */
function formatCharacterName(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function CharacterVoiceSelector({
  characters,
  selectedCharacter,
  onSelect,
}: CharacterVoiceSelectorProps) {
  return (
    <div className="character-selector">
      <h4 className="text-pip-boy-green text-sm font-semibold mb-2">選擇角色語音</h4>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {characters.map((char) => (
          <button
            key={char}
            role="radio"
            aria-checked={selectedCharacter === char}
            aria-label={formatCharacterName(char)}
            onClick={() => onSelect(char)}
            className={`
              px-3 py-2 rounded border-2 transition-all text-xs
              ${
                selectedCharacter === char
                  ? 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green'
                  : 'border-pip-boy-green/40 text-pip-boy-green/60 hover:border-pip-boy-green/80 hover:text-pip-boy-green'
              }
            `}
          >
            {formatCharacterName(char)}
          </button>
        ))}
      </div>
    </div>
  )
}

import { Button } from "@/components/ui/button"; /**
 * CharacterVoiceSelector Component
 * Allows users to select character voice for story audio playback
 */

interface CharacterVoiceSelectorProps {
  characters: string[];
  selectedCharacter?: string;
  onSelect: (characterKey: string) => void;
}

/**
 * Format character key to display name
 * Example: "brotherhood_scribe" -> "Brotherhood Scribe"
 */
function formatCharacterName(key: string): string {
  return key.
  split('_').
  map((word) => word.charAt(0).toUpperCase() + word.slice(1)).
  join(' ');
}

export function CharacterVoiceSelector({
  characters,
  selectedCharacter,
  onSelect
}: CharacterVoiceSelectorProps) {
  return (
    <div className="character-selector">
      <h4 className="text-pip-boy-green text-sm font-semibold mb-2">選擇角色語音</h4>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {characters.map((char) =>
        <Button size="icon" variant="default"
        key={char}
        role="radio"
        aria-checked={selectedCharacter === char}
        aria-label={formatCharacterName(char)}
        onClick={() => onSelect(char)}
        className="{expression}">








            {formatCharacterName(char)}
          </Button>
        )}
      </div>
    </div>);

}
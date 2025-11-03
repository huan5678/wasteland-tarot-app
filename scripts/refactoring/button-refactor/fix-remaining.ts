#!/usr/bin/env bun
import { ButtonScanner } from './scanner';
import { StyleAnalyzer } from './analyzer';
import { VariantMapper } from './mapper';
import { CodeTransformer } from './transformer';

const files = [
  'src/app/dashboard/page.tsx',
  'src/components/cards/PaginationControls.tsx',
  'src/components/dashboard/KarmaLog/KarmaLog.tsx',
  'src/components/music-player/SavePresetDialog.tsx',
  'src/components/music-player/InstrumentTrackRow.tsx',
  'src/components/music-player/PresetManager.tsx',
  'src/components/music-player/RhythmEditorControls.tsx',
  'src/components/music-player/AIGenerationPanel.tsx',
];

async function main() {
  const scanner = new ButtonScanner();
  const analyzer = new StyleAnalyzer();
  const mapper = new VariantMapper();
  const transformer = new CodeTransformer();

  let totalButtons = 0;

  for (const file of files) {
    console.log(`Processing ${file}...`);
    const result = await scanner.scanBatch({
      name: 'Fix',
      patterns: [file],
      excludePatterns: [],
    });

    if (result.totalButtons === 0) {
      console.log(`  No buttons found`);
      continue;
    }

    const mappings = result.buttons.map(button => {
      const analysis = analyzer.analyze(button);
      return mapper.map(analysis);
    });

    await transformer.transform(file, mappings);
    console.log(`  ✅ ${result.totalButtons} buttons replaced`);
    totalButtons += result.totalButtons;
  }

  console.log(`\n✅ Total: ${totalButtons} buttons fixed`);
}

main().catch(console.error);

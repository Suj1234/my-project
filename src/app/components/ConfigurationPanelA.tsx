import { BlockData } from '../types/journey';
import { ConfigurationPanel } from './ConfigurationPanel';
import { RouterPanelA } from './RouterPanelA';
import { StepDividerPanel } from './StepDividerPanel';

interface Props {
  block: BlockData | null;
  allBlocks: BlockData[];
  onClose: () => void;
  onSave: (block: BlockData) => void;
  onDelete: (blockId: string) => void;
}

export function ConfigurationPanelA(props: Props) {
  if (props.block?.type === 'router') {
    return (
      <RouterPanelA
        block={props.block}
        allBlocks={props.allBlocks}
        onClose={props.onClose}
        onSave={props.onSave}
        onDelete={props.onDelete}
      />
    );
  }
  if (props.block?.type === 'step') {
    return (
      <StepDividerPanel
        block={props.block}
        onClose={props.onClose}
        onSave={props.onSave}
        onDelete={props.onDelete}
      />
    );
  }
  return <ConfigurationPanel {...props} />;
}

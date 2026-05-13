import { BlockData } from '../types/journey';
import { ConfigurationPanel } from './ConfigurationPanel';
import { RouterPanelC } from './RouterPanelC';

interface Props {
  block: BlockData | null;
  allBlocks: BlockData[];
  onClose: () => void;
  onSave: (block: BlockData) => void;
  onDelete: (blockId: string) => void;
}

export function ConfigurationPanelC(props: Props) {
  if (props.block?.type === 'router') {
    return (
      <RouterPanelC
        block={props.block}
        allBlocks={props.allBlocks}
        onClose={props.onClose}
        onSave={props.onSave}
        onDelete={props.onDelete}
      />
    );
  }
  return <ConfigurationPanel {...props} />;
}

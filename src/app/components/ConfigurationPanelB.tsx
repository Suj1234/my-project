import { BlockData } from '../types/journey';
import { ConfigurationPanel } from './ConfigurationPanel';
import { RouterPanelB } from './RouterPanelB';

interface Props {
  block: BlockData | null;
  allBlocks: BlockData[];
  onClose: () => void;
  onSave: (block: BlockData) => void;
  onDelete: (blockId: string) => void;
  onAddDefaultBlock?: () => void;
}

export function ConfigurationPanelB(props: Props) {
  if (props.block?.type === 'router') {
    return (
      <RouterPanelB
        block={props.block}
        allBlocks={props.allBlocks}
        onClose={props.onClose}
        onSave={props.onSave}
        onDelete={props.onDelete}
        onAddDefaultBlock={props.onAddDefaultBlock}
      />
    );
  }
  return <ConfigurationPanel {...props} />;
}

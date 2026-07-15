import JSZip from 'jszip';
import { useProjectStore } from '../store/useProjectStore.js';
import { useWidgetStore } from '../store/useWidgetStore.js';
import { useFlowStore } from '../store/useFlowStore.js';
import { useDeviceStore } from '../store/useDeviceStore.js';
import { generateProject } from '../engine/codegen/index.js';

export function useExport() {
  const exportProject = async () => {
    const { screens } = useProjectStore.getState();
    const { widgets } = useWidgetStore.getState();
    const { edges } = useFlowStore.getState();
    const { selectedDevice } = useDeviceStore.getState();

    // Call compilation generator coordinator
    const result = generateProject('WatchForgeProject', screens, widgets, edges, selectedDevice);

    const zip = new JSZip();

    // Fill ZIP structure recursively
    Object.entries(result.files).forEach(([path, content]) => {
      zip.file(path, content);
    });

    // Generate browser download trigger
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `watchforge_${selectedDevice.framework.toLowerCase()}_project.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return { exportProject };
}

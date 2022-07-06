import { Button, Group } from '@mantine/core';
import { showNotification, updateNotification } from '@mantine/notifications';
import {
  IconCheck,
  IconLicense,
  IconPlayerPlay,
  IconPlayerStop,
  IconPlus,
  IconRefresh,
  IconRotateClockwise,
  IconTrash,
  IconX,
} from '@tabler/icons';
import axios from 'axios';
import Dockerode from 'dockerode';
import addToHomarr from '../../tools/addToHomarr';
import { useConfig } from '../../tools/state';

function sendDockerCommand(action: string, containerId: string, containerName: string) {
  showNotification({
    id: containerId,
    loading: true,
    title: `${action}ing container ${containerName.substring(1)}`,
    message: undefined,
    autoClose: false,
    disallowClose: true,
  });
  axios.get(`/api/docker/container/${containerId}?action=${action}`).then((res) => {
    setTimeout(() => {
      if (res.data.success === true) {
        updateNotification({
          id: containerId,
          title: `Container ${containerName} ${action}ed`,
          message: `Your container was successfully ${action}ed`,
          icon: <IconCheck />,
          autoClose: 2000,
        });
      }
      if (res.data.success === false) {
        updateNotification({
          id: containerId,
          color: 'red',
          title: 'There was an error with your container.',
          message: undefined,
          icon: <IconX />,
          autoClose: 2000,
        });
      }
    }, 500);
  });
}

export interface ContainerActionBarProps {
  selected: Dockerode.ContainerInfo[];
  reload: () => void;
}

export default function ContainerActionBar({ selected, reload }: ContainerActionBarProps) {
  const { config, setConfig } = useConfig();
  return (
    <Group>
      <Button
        leftIcon={<IconRotateClockwise />}
        onClick={() =>
          Promise.all(
            selected.map((container) =>
              sendDockerCommand('restart', container.Id, container.Names[0].substring(1))
            )
          ).then(() => reload())
        }
        variant="light"
        color="orange"
        radius="md"
      >
        Restart
      </Button>
      <Button
        leftIcon={<IconPlayerStop />}
        onClick={() =>
          Promise.all(
            selected.map((container) => {
              if (container.State === 'stopped' || container.State === 'created' || container.State === 'exited') {
                return showNotification({
                  id: container.Id,
                  title: `Failed to stop ${container.Names[0].substring(1)}`,
                  message: "You can't stop a stopped container",
                  autoClose: 1000,
                });
              }
              return sendDockerCommand('stop', container.Id, container.Names[0].substring(1));
            })
          ).then(() => reload())
        }
        variant="light"
        color="red"
        radius="md"
      >
        Stop
      </Button>
      <Button
        leftIcon={<IconPlayerPlay />}
        onClick={() =>
          Promise.all(
            selected.map((container) =>
              sendDockerCommand('start', container.Id, container.Names[0].substring(1))
            )
          ).then(() => reload())
        }
        variant="light"
        color="green"
        radius="md"
      >
        Start
      </Button>
      <Button leftIcon={<IconRefresh />} onClick={() => reload()} variant="light" radius="md">
        Refresh data
      </Button>
      <Button
        leftIcon={<IconPlus />}
        color="indigo"
        variant="light"
        radius="md"
        onClick={() =>
          Promise.all(selected.map((container) => addToHomarr(container, config, setConfig))).then(
            () => reload()
          )
        }
      >
        Add to Homarr
      </Button>
      <Button
        leftIcon={<IconTrash />}
        color="red"
        variant="light"
        radius="md"
        onClick={() =>
          Promise.all(
            selected.map((container) => {
              if (container.State === 'running') {
                return showNotification({
                  id: container.Id,
                  title: `Failed to delete ${container.Names[0].substring(1)}`,
                  message: "You can't delete a running container",
                  autoClose: 1000,
                });
              }
              return sendDockerCommand('remove', container.Id, container.Names[0].substring(1));
            })
          ).then(() => reload())
        }
      >
        Remove
      </Button>
    </Group>
  );
}

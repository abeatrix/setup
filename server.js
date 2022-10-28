import server from 'bunrest';
import cors from 'cors';
import { spawnSync, write, file } from 'bun';
import { copyFileSync } from 'fs';
import { basename } from 'path';

const app = server();

const copyOverrideFile = (size) => {
  if (size !== 'XS') {
    copyFileSync(
      `/home/sourcegraph/override.${size}.yaml`,
      '/home/sourcegraph/override.yaml'
    );
  }
};

app.use(cors());

app.get('/', (req, res) => res.status(200).json({ message: 'RUNNING' }));

app.post('/new', (req, res) => {
  const size = req.body.size;
  copyOverrideFile(size);
  res.status(200).json({ message: 'DONE' });
});

app.post('/upgrade', async (req, res) => {
  const version = req.body.version;
  const size = req.body.size;
  try {
    copyOverrideFile(size);
    const { stdout } = spawnSync([
      'helm',
      'upgrade',
      '-i',
      '-f',
      '/home/sourcegraph/deploy/install/override.yaml',
      '--version',
      version,
      'sourcegraph',
      'sourcegraph/sourcegraph',
    ]);
    const output = stdout.toString();
    res
      .status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .json({ message: output });
  } catch (error) {
    console.error(error);
  }
});

app.post('/size', (req, res) => {
  const size = req.body.size;
  copyOverrideFile(size);
  res.status(200).json({ message: 'DONE' });
});

app.post('/upload', (req, res) => {
  try {
    const file = req.body.file;
    write(`/home/sourcegraph/${file.name}`, file.blob);
    res
      .status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .json({ message: 'UPLOADED SUCESSFULLY' });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .setHeader('Access-Control-Allow-Origin', '*')
      .json({ message: 'FAILED TO UPLOAD' });
  }
});

app.listen(3344, () => console.log('App is listening on port 3344'));

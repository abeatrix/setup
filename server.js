import server from 'bunrest';
import cors from 'cors';
import { spawnSync, write } from 'bun';
import { copyFileSync } from 'fs';

const install = (mode) => {
  return spawnSync(['bash', `/home/sourcegraph/setup/scripts/${mode}.sh`]);
};

const copyOverrideFile = (size) => {
  if (size !== 'XS') {
    copyFileSync(
      `/home/sourcegraph/deploy/install/override.${size}.yaml`,
      '/home/sourcegraph/deploy/install/override.yaml'
    );
  }
};

const app = server();

app.use(cors());

app.get('/', (req, res) => res.status(200).json({ message: 'RUNNING' }));

app.post('/new', (req, res) => {
  const size = req.body.size;
  copyOverrideFile(size);
  res.status(200).json({ message: 'DONE' });
  install('new');
});

app.post('/upgrade', async (req, res) => {
  const version = req.body.version;
  const size = req.body.size;
  try {
    copyOverrideFile(size);
    install('upgrade');
    res
      .status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .json({ message: 'UPLOADING' });
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
    const file = req.body;
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

app.listen(3389, () => console.log('App is listening on port 3389'));

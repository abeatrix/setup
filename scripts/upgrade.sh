#!/usr/bin/bash

/usr/local/bin/helm --kubeconfig /etc/rancher/k3s/k3s.yaml upgrade -i -f /home/sourcegraph/deploy/install/override.yaml --version "$SOURCEGRAPH_VERSION" sourcegraph sourcegraph/sourcegraph

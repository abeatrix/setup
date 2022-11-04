#!/usr/bin/env bash
set -exuo pipefail

###############################################################################
# ACTION REQUIRED IF RUNNING THIS SCRIPT MANUALLY
# IMPORTANT: Keep this commented when building with the packer pipeline
###############################################################################
INSTANCE_VERSION="" # e.g. 4.0.1
INSTANCE_SIZE="XS"  # e.g. XS / S / M / L / XL
##################### NO CHANGES REQUIRED BELOW THIS LINE #####################
# Variables
###############################################################################
SOURCEGRAPH_VERSION=$INSTANCE_VERSION
SOURCEGRAPH_SIZE=$INSTANCE_SIZE
INSTANCE_USERNAME=$(whoami)
SOURCEGRAPH_DEPLOY_REPO_URL='https://github.com/sourcegraph/deploy.git'
KUBECONFIG_FILE='/etc/rancher/k3s/k3s.yaml'
###############################################################################
# Prepare the system
###############################################################################
# Clone the deployment repository
cd
git clone $SOURCEGRAPH_DEPLOY_REPO_URL
cp deploy/install/override."$SOURCEGRAPH_SIZE".yaml deploy/install/override.yaml
###############################################################################
# Install k3s (Kubernetes single-machine deployment)
###############################################################################
curl -sfL https://get.k3s.io | K3S_TOKEN=none sh -s - \
    --node-name sourcegraph-0 \
    --write-kubeconfig-mode 644 \
    --cluster-cidr 10.10.0.0/16 \
    --kubelet-arg containerd=/run/k3s/containerd/containerd.sock \
    --etcd-expose-metrics true
# Confirm k3s and kubectl are up and running
sleep 5 && k3s kubectl get node
# Correct permissions of k3s config file
sudo chown "$INSTANCE_USERNAME" /etc/rancher/k3s/k3s.yaml
sudo chmod go-r /etc/rancher/k3s/k3s.yaml
# Set KUBECONFIG to point to k3s for 'kubectl' commands to work
export KUBECONFIG='/etc/rancher/k3s/k3s.yaml'
cp /etc/rancher/k3s/k3s.yaml /home/"$INSTANCE_USERNAME"/.kube/config
###############################################################################
# Set up Sourcegraph using Helm
###############################################################################
# Install Helm
curl -sSL https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
helm version --short
# Store Sourcegraph Helm charts locally, rename the file to 'sourcegraph-charts.tgz'
helm --kubeconfig $KUBECONFIG_FILE repo add sourcegraph https://helm.sourcegraph.com/release
# Create override configMap for prometheus before startup Sourcegraph
k3s kubectl apply -f deploy/install/prometheus-override.ConfigMap.yaml
helm --kubeconfig $KUBECONFIG_FILE upgrade -i -f deploy/install/override.yaml --version "$SOURCEGRAPH_VERSION" sourcegraph sourcegraph/sourcegraph
k3s kubectl create -f deploy/install/ingress.yaml
kubectl get deploy/sourcegraph-frontend | grep -p "2/2"
curl ifconfig.me

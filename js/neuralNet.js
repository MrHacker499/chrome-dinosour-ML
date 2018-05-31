class Neuron {
    constructor(weights, bias) {
        this.weights = weights;
        this.bias = bias;
        this.output = 0;
    }

    static random(numOfInputs) {
        const weights = [];
        for (let i = 0; i < numOfInputs; i++) {
            weights.push(Neuron.randomWeight())
        }
        return new Neuron(weights, Neuron.randomWeight());
    }

    calculateOutput(inputs) {
        let result = 0;
        for (let i = 0; i < this.weights.length; i++) {
            result += this.weights[i] * Neuron.inputValue(inputs[i]);
        }
        this.output = Neuron.sigmoid(result + this.bias);
    }

    static sigmoid(t) {
        return 1 / (1 + Math.pow(Math.E, -t));
    }

    static randomWeight() {
        return Math.random() * 100 - 50;
    }

    static inputValue(input) {
        if (isNaN(input)) {
            return input.output;
        }
        return input;
    }

    static combine(neuron1, neuron2) {
        const newWeights = [];
        for (let i = 0; i < neuron1.weights.length; i++) {
            const newWeight = (neuron1.weights[i] + neuron2.weights[i]) / 2 + Neuron.mutation();
            newWeights.push(newWeight);
        }
        const newBias = (neuron1.bias + neuron2.bias) / 2 + Neuron.mutation();
        return new Neuron(newWeights, newBias);
    }

    static mutation() {
        return 10 / Neuron.randomWeight();
    }
}

const numOfInputs = 2;
const numOfHiddenLayers = 1;
const numOfNeuronsInLayer = 3;

class NeuralNet {

    constructor(neuralNet) {
        this.neuralNet = neuralNet;
    }

    random() {
        this.generateInputLayer();
        this.generateHiddenLayers();
        this.generateOutputLayer();
    }

    generateInputLayer() {
        const inputLayer = [];
        for (let i = 0; i < numOfInputs; i++) {
            inputLayer.push(0);
        }
        this.neuralNet.push(inputLayer);
    }

    generateHiddenLayers() {
        for (let i = 0; i < numOfHiddenLayers; i++) {
            const layer = [];
            for (let j = 0; j < numOfNeuronsInLayer; j++) {
                const lastLayerLength = this.neuralNet[this.neuralNet.length - 1].length;
                layer.push(Neuron.random(lastLayerLength));
            }
            this.neuralNet.push(layer);
        }
    }

    generateOutputLayer() {
        this.neuralNet.push([Neuron.random(numOfNeuronsInLayer)]);
    }

    output(inputs) {
        this.neuralNet[0] = inputs;
        for (let i = 1; i < this.neuralNet.length; i++) {
            for (let j = 0; j < this.neuralNet[i].length; j++) {
                this.neuralNet[i][j].calculateOutput(this.neuralNet[i - 1]);
            }
        }
        return this.neuralNet[this.neuralNet.length - 1][0].output;
    }

    static combine(neuralNet1, neuralNet2) {
        const net1 = neuralNet1.neuralNet;
        const net2 = neuralNet2.neuralNet;
        const newNet = [net1[0]];
        for (let i = 1; i < net1.length; i++) {
            const layer = [];
            for (let j = 0; j < net1[i].length; j++) {
                const newNeuron = Neuron.combine(net1[i][j], net2[i][j]);
                layer.push(newNeuron);
            }
            newNet.push(layer);
        }
        return new NeuralNet(newNet);
    }
}


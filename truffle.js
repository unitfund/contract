module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*" // Match any network id
        },
        test: {
            host: "localhost",
            port: 8545,
            network_id: "15",
            from: "0x93212497bb5634c9035c07fc2d9a5b2e07a2db0f",
            gas: 0x3D74D0
        }
    }
};
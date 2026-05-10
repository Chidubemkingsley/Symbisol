/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/symbisol.json`.
 */
export type Symbisol = {
  "address": "5383AVU3XCHu2L4dEVZVGtitekZEuaFBFoxgnFQJJmmB",
  "metadata": {
    "name": "symbisol",
    "version": "1.0.0",
    "spec": "0.1.0",
    "description": "Symbisol — Agent Registry, Reputation, and Escrow on Solana"
  },
  "instructions": [
    {
      "name": "completeJob",
      "discriminator": [
        221,
        216,
        225,
        72,
        101,
        250,
        3,
        11
      ],
      "accounts": [
        {
          "name": "worker",
          "writable": true,
          "signer": true
        },
        {
          "name": "workerAgent",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "worker"
              }
            ]
          }
        },
        {
          "name": "job",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  111,
                  98
                ]
              },
              {
                "kind": "arg",
                "path": "jobId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "jobId"
              }
            ]
          }
        },
        {
          "name": "categoryLeader",
          "docs": [
            "Category leader PDA — updated if worker now has highest reputation"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  116,
                  101,
                  103,
                  111,
                  114,
                  121,
                  95,
                  108,
                  101,
                  97,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "job.category",
                "account": "job"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "jobId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createJob",
      "discriminator": [
        178,
        130,
        217,
        110,
        100,
        27,
        82,
        119
      ],
      "accounts": [
        {
          "name": "requester",
          "writable": true,
          "signer": true
        },
        {
          "name": "workerAgent",
          "docs": [
            "The worker's agent PDA — price is read from here"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "worker_agent.owner",
                "account": "agent"
              }
            ]
          }
        },
        {
          "name": "job",
          "docs": [
            "Job PDA — initialized here, keyed by job_id_seed (= current next_job_id)"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  111,
                  98
                ]
              },
              {
                "kind": "arg",
                "path": "jobIdSeed"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "docs": [
            "Escrow PDA — holds the SOL until settlement"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "jobIdSeed"
              }
            ]
          }
        },
        {
          "name": "globalStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "category",
          "type": "string"
        },
        {
          "name": "parentJobId",
          "type": "u64"
        },
        {
          "name": "jobIdSeed",
          "type": "u64"
        }
      ]
    },
    {
      "name": "disputeJob",
      "discriminator": [
        101,
        104,
        253,
        231,
        1,
        139,
        108,
        100
      ],
      "accounts": [
        {
          "name": "requester",
          "writable": true,
          "signer": true
        },
        {
          "name": "job",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  111,
                  98
                ]
              },
              {
                "kind": "arg",
                "path": "jobId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "jobId"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "jobId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "failJob",
      "discriminator": [
        211,
        222,
        65,
        39,
        115,
        107,
        125,
        43
      ],
      "accounts": [
        {
          "name": "caller",
          "writable": true,
          "signer": true
        },
        {
          "name": "workerAgent",
          "docs": [
            "The worker's agent PDA — reputation will be penalized"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "job.worker",
                "account": "job"
              }
            ]
          }
        },
        {
          "name": "job",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  111,
                  98
                ]
              },
              {
                "kind": "arg",
                "path": "jobId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "jobId"
              }
            ]
          }
        },
        {
          "name": "requesterRecipient",
          "docs": [
            "Receives the refunded lamports (must be the original requester)"
          ],
          "writable": true
        },
        {
          "name": "globalStats",
          "docs": [
            "GlobalStats holds the canonical authority pubkey"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "jobId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "govSetReputation",
      "docs": [
        "Governance: set an agent's reputation directly.",
        "`agent_owner` is the wallet that owns the agent PDA."
      ],
      "discriminator": [
        3,
        191,
        37,
        195,
        153,
        126,
        2,
        189
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Must be the contract authority stored in GlobalStats"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "agentAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "agentOwner"
              }
            ]
          }
        },
        {
          "name": "globalStats",
          "docs": [
            "GlobalStats holds the canonical authority pubkey"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "agentOwner",
          "type": "pubkey"
        },
        {
          "name": "newScore",
          "type": "u16"
        }
      ]
    },
    {
      "name": "initializeGlobalStats",
      "discriminator": [
        57,
        82,
        52,
        126,
        182,
        236,
        5,
        131
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "globalStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "refundEscrow",
      "discriminator": [
        107,
        186,
        89,
        99,
        26,
        194,
        23,
        204
      ],
      "accounts": [
        {
          "name": "job",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  111,
                  98
                ]
              },
              {
                "kind": "arg",
                "path": "jobId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "jobId"
              }
            ]
          }
        },
        {
          "name": "requesterRecipient",
          "docs": [
            "Must be the original requester"
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "jobId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "registerAgent",
      "discriminator": [
        135,
        157,
        66,
        195,
        2,
        113,
        175,
        30
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "agent",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "globalStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "endpoint",
          "type": "string"
        },
        {
          "name": "priceLamports",
          "type": "u64"
        },
        {
          "name": "category",
          "type": "string"
        }
      ]
    },
    {
      "name": "setActive",
      "discriminator": [
        29,
        16,
        225,
        132,
        38,
        216,
        206,
        33
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "agent",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "active",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updateAgent",
      "discriminator": [
        85,
        2,
        178,
        9,
        119,
        139,
        102,
        164
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "agent",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "endpoint",
          "type": "string"
        },
        {
          "name": "priceLamports",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "agent",
      "discriminator": [
        47,
        166,
        112,
        147,
        155,
        197,
        86,
        7
      ]
    },
    {
      "name": "categoryLeader",
      "discriminator": [
        191,
        228,
        36,
        167,
        139,
        36,
        129,
        167
      ]
    },
    {
      "name": "escrow",
      "discriminator": [
        31,
        213,
        123,
        187,
        186,
        22,
        218,
        155
      ]
    },
    {
      "name": "globalStats",
      "discriminator": [
        119,
        53,
        78,
        3,
        254,
        129,
        78,
        28
      ]
    },
    {
      "name": "job",
      "discriminator": [
        75,
        124,
        80,
        203,
        161,
        180,
        202,
        80
      ]
    }
  ],
  "events": [
    {
      "name": "jobCreated",
      "discriminator": [
        48,
        110,
        162,
        177,
        67,
        74,
        159,
        131
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "ownerOnly",
      "msg": "Only the contract owner can call this"
    },
    {
      "code": 6001,
      "name": "agentExists",
      "msg": "Agent already registered"
    },
    {
      "code": 6002,
      "name": "agentNotFound",
      "msg": "Agent not found"
    },
    {
      "code": 6003,
      "name": "jobNotFound",
      "msg": "Job not found"
    },
    {
      "code": 6004,
      "name": "insufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6005,
      "name": "unauthorized",
      "msg": "unauthorized"
    },
    {
      "code": 6006,
      "name": "invalidParams",
      "msg": "Invalid parameters"
    },
    {
      "code": 6007,
      "name": "jobAlreadyComplete",
      "msg": "Job already complete"
    },
    {
      "code": 6008,
      "name": "selfHire",
      "msg": "Cannot hire yourself"
    },
    {
      "code": 6009,
      "name": "escrowNotFound",
      "msg": "Escrow not found"
    },
    {
      "code": 6010,
      "name": "deadlineNotPassed",
      "msg": "Deadline not passed"
    },
    {
      "code": 6011,
      "name": "jobAlreadySettled",
      "msg": "Job already settled"
    },
    {
      "code": 6012,
      "name": "notDisputable",
      "msg": "Not disputable"
    },
    {
      "code": 6013,
      "name": "categoryTooLong",
      "msg": "Category exceeds max length"
    },
    {
      "code": 6014,
      "name": "nameTooLong",
      "msg": "Name exceeds max length"
    },
    {
      "code": 6015,
      "name": "endpointTooLong",
      "msg": "Endpoint exceeds max length"
    }
  ],
  "types": [
    {
      "name": "agent",
      "docs": [
        "Agent profile account"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "endpoint",
            "type": "string"
          },
          {
            "name": "priceLamports",
            "type": "u64"
          },
          {
            "name": "category",
            "type": "string"
          },
          {
            "name": "reputation",
            "type": "u16"
          },
          {
            "name": "jobsCompleted",
            "type": "u64"
          },
          {
            "name": "jobsFailed",
            "type": "u64"
          },
          {
            "name": "totalEarned",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "registeredAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "categoryLeader",
      "docs": [
        "Category leader tracker — one PDA per category string"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "category",
            "type": "string"
          },
          {
            "name": "leader",
            "type": "pubkey"
          },
          {
            "name": "reputation",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "escrow",
      "docs": [
        "Escrow account — SOL held by program until job settlement"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "requester",
            "type": "pubkey"
          },
          {
            "name": "worker",
            "type": "pubkey"
          },
          {
            "name": "deadlineSlot",
            "type": "u64"
          },
          {
            "name": "settled",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "globalStats",
      "docs": [
        "Global stats account (single PDA) — also stores the contract authority"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "totalAgents",
            "type": "u64"
          },
          {
            "name": "totalJobs",
            "type": "u64"
          },
          {
            "name": "totalVolume",
            "type": "u64"
          },
          {
            "name": "nextJobId",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "job",
      "docs": [
        "Job record account"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "requester",
            "type": "pubkey"
          },
          {
            "name": "worker",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "category",
            "type": "string"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "jobStatus"
              }
            }
          },
          {
            "name": "parentJobId",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "completedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "jobCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "jobId",
            "type": "u64"
          },
          {
            "name": "requester",
            "type": "pubkey"
          },
          {
            "name": "worker",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "category",
            "type": "string"
          },
          {
            "name": "parentJobId",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "jobStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "complete"
          },
          {
            "name": "failed"
          },
          {
            "name": "disputed"
          }
        ]
      }
    }
  ]
};

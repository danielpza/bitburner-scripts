# Bitburner resources and tips

- [NS Entry Point](https://github.com/bitburner-official/bitburner-src/blob/bec737a25307be29c7efef147fc31effca65eedc/markdown/bitburner.ns.md)

- programs
  - brutessh
  - ftpcrack
  - httpworm
  - relaysmtp
  - sqlinject
  - nuke
- printing
  - alert
  - print
  - printf Print formatted string
  - printRaw Print React Node to the logs
  - sprint Format string
  - tprint Print to the terminal
  - tprintf Print formatted string to the terminal
  - tprintRaw
  - vsprintf
  - tFormat
  - formatNumber
  - formatPercent
  - formatRam
- file related
  - mv
  - ls
  - ps
  - prompt
  - read
  - readPort
  - write
  - writePort
- owned servers
  - purchaseServer
  - renamePurchasedServer
  - upgradePurchasedServer
  - deleteServer
  - getPurchasedServerCost(ram) Get cost of purchasing a server.
  - getPurchasedServerLimit() Returns the maximum number of servers you can purchase.
  - getPurchasedServerMaxRam() Returns the maximum RAM that a purchased server can have.
  - getPurchasedServers() Returns an array with the hostnames of all of the servers you have purchased.
  - getPurchasedServerUpgradeCost(hostname, ram)
  - hasTorRouter() Returns whether the player has access to the darkweb.
- servers
  - serverExists(host) Returns a boolean denoting whether or not the specified server exists.
  - getServer(host) Returns a server object for the given server. Defaults to the running script's server if host is not specified.
  - getServerBaseSecurityLevel(host) Get the base security level of a server.
  - getServerGrowth(host) Get a server growth parameter.
  - getServerMaxMoney(host) Get the maximum money available on a server.
  - getServerMaxRam(host) Get the maximum amount of RAM on a server.
  - getServerMinSecurityLevel(host) Returns the minimum security level of the target server.
  - getServerMoneyAvailable(host) Get money available on a server.
  - getServerNumPortsRequired(host) Returns the number of open ports required to successfully run NUKE.exe on the specified server.
  - getServerRequiredHackingLevel(host) Returns the required hacking level of the target server.
  - getServerSecurityLevel(host) Get server security level.
  - getServerUsedRam(host) Get the used RAM on a server.
  - hasRootAccess(host) Check if you have root access on a server.
- info
  - growthAnalyze(host, multiplier, cores) Calculate the number of grow threads needed for a given multiplicative growth factor.
  - growthAnalyzeSecurity(threads, hostname, cores) Calculate the security increase for a number of grow threads.
  - getGrowTime(host) Get the execution time of a grow() call.
  - hackAnalyze(host) Get the part of money stolen with a single thread.
  - hackAnalyzeChance(host) Get the chance of successfully hacking a server.
  - hackAnalyzeSecurity(threads, hostname) Get the security increase for a number of threads.
  - hackAnalyzeThreads(host, hackAmount) Calculate the decimal number of threads needed to hack a specified amount of money from a target host.
  - getHackTime(host) Get the execution time of a hack() call.
  - weakenAnalyze(threads, cores) Predict the effect of weaken.
  - getWeakenTime(host) Get the execution time of a weaken() call.
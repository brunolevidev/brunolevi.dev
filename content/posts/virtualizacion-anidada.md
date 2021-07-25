---
title: "Virtualización anidada"
date: 2021-05-03
draft: false

subtitle: "Virtual Box + Vagrant + Docker + VS Code = ❤"
description: "En esta guía mostraré mi combinación para desarollo web basado en Vagrant + Virtual Box + Docker + VS Code Remote SSH"
categories: ["Desarrollo", "Virtualización", "Docker", "Automatización"]
tags: ["Docker", "Virtualbox", "Docker", "Visual Studio Code", "Vagrant", "Automatización"]
images: ["https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-05-03-virtualizacion-anidada/banner.webp"]
---

# Introducción

Windows 10 es un excelente sistema operativo por su gran catálogo de software a nuestra disposición, sin embargo, en el ámbito del desarrollo de software no me convence del todo PowerShell o CMD porque ya me acostumbré demasiado al uso de bash o zsh. 

Si bien existen alternativas como WSL o el uso de dual boot, considero que no cumple con mis necesidades y no es tan ágil del todo. En esta guía mostraré como tengo mi entorno de desarrollo web utilizando Virtual Box, Vagrant, Ubuntu 20.04 y Docker para una virtualización anidada y automatizada.

# Requisitos

- Tener instalado Virtual Box
- Tener instalado Vagrant
- Tener activada la virtualización en la BIOS
- Tener una computadora que pueda tener varias virtualizaciones activas

# Instalación y configuración

El procedimiento es bastante sencillo, a continuación mostraré los pasos a seguir.

## Pull de la imagen de Ubuntu 20.04 y provisionamiento

El archivo `.vagrantfile` es el punto de entrada para que Vagrant pueda crear, provisionar y configurar la máquina virtual, por lo tanto, debemos crearlo. 

Esta es una configuración inicial que te ayudará a comprender un poco mejor el archivo `.vagrantfile`
```ruby
Vagrant.configure("2") do |config|

    # Esta línea permite configurar la imágen del sistema operativo, podemos encontrarlas en: https://app.vagrantup.com/boxes/search
    config.vm.box = "ubuntu/focal64"

    # Permite abrir un puerto para su uso. guest es la máquina virtual y host la máquina física
    config.vm.network "forwarded_port", guest: 80, host: 80
    
    # Permite abrir una ip pública dentro de tu red, esto lo puedes cambiar a private_network:
    config.vm.network "public_network", ip: "192.168.0.13"

    config.vm.provider "virtualbox" do |vb|
    # Al utiliazr la versión CLI de Linux no usaremos GUI
        vb.gui = false
  
    # Personalizar la cantidad de memoria de la máquina virtual
        vb.memory = "2048"
    end

    # Provisionamiento de la máquina virtial, es decir, este script se ejecutará cuando inicies la máquina por primera vez
    # Si deseas instalar software adicional o realizar configuraciones adicionales hazlo desde aquí
    # Aquí no es necesario usar el prefijo sudo
    config.vm.provision "shell", inline: <<-SHELL
        apt-get update
        apt-get dist-upgrade -y
        apt-get install -y build-essential
        apt-get install -y gcc g++ make libc6
        apt-get install -y subversion cvs mercurial git
        apt-get install -y software-properties-common
        apt-get install -y curl wget htop ntp nmap
        apt-get install -y net-tools
        apt-get update
        apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io
        curl -L "https://github.com/docker/compose/releases/download/1.29.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
        apt-get update
        apt-get install -y nodejs
        apt-get install -y ruby-full zlib1g-dev
    SHELL
end
```

Una vez creado nuestro `.vagrantfile` ejecutaremos el siguiente comando para inciar, configurar y provisionar nuestra máquina virtual.

```powershell
vagrant up
```

![Comando vagrant up ejecutado](https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-05-03-virtualizacion-anidada/maquina-configurada.webp "Comando vagrant up ejecutado")

Cuando termine, ejecutaremos el siguiente comando y copiaremos la salida.

```powershell
vagrant ssh-config
```

![Comando vagrant ssh-config ejecutado](https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-05-03-virtualizacion-anidada/maquina-ssh-config.webp "Comando vagrant ssh-config ejecutado")

Lo que copiamos lo pegaremos en nuestro archivo `config` que se encuentra localizado en `~/.ssh/`. Si no existe, crearlo.

```
Host default
  HostName 127.0.0.1
  User vagrant
  Port 2200
  UserKnownHostsFile /dev/null
  StrictHostKeyChecking no
  PasswordAuthentication no
  IdentityFile D:/boxes/prueba/.vagrant/machines/default/virtualbox/private_key
  IdentitiesOnly yes
  LogLevel FATAL
```

Para iniciar sesión en nuestra máquina virtual deberemos ejecutar el comando

```powershell
vagrant ssh
```

![Comando vagrant ssh ejecutado](https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-05-03-virtualizacion-anidada/vagrant-ssh.webp "Comando vagrant ssh ejecutado")

## Docker & Compose

Si utilizaste mi archivo de configuración, ya debes tener instalado docker, docker-compose y nodejs, lo básico para iniciar cualquier proyecto web. Para usar docker es necesario configurarlo para ejecutarlo sin necesidad del prefijo sudo, para ello realizaremos lo siguiente.

- Crear el grupo `docker`

```bash
sudo groupadd docker
```

- Agregar nuestro usuario al grupo `docker`

```bash
sudo usermod -aG docker $USER
```

- Activar los cambios en los grupos

```bash
newgrp docker 
```

- Verificar que se puedan correr comandos de `docker` sin la necesidad del prefijo `sudo`

```bash
docker run hello-world
```

![Correr docker sin sudo](https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-05-03-virtualizacion-anidada/docker-sin-sudo.webp "Correr docker sin sudo")

Ahora verás como iniciar un nuevo proyecto de Laravel 8 utilizando su nueva herramienta Laravel Sail.

```bash
curl -s "https://laravel.build/example-app" | bash
```

![Laravel instalado](https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-05-03-virtualizacion-anidada/laravel-instalado.webp "Laravel instalado")

Si configuraste y seguiste mis pasos, ahora podrás inciar Laravel Sail con el comando:

```bash
cd example-app
./vendor/bin/sail up -d
```
![Inicializar Laravel Sail](https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-05-03-virtualizacion-anidada/sail-up.webp "Inicializar Laravel Sail")

Si visitamos la ip que configuramos `http://192.168.0.13` en nuestro navegador podremos ver que Laravel ya esta corriendo:

![Laravel Sail corriendo](https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-05-03-virtualizacion-anidada/laravel-running.webp "Laravel Sail corriendo")

## Visual Studio Code Remote SSH

Ahora debemos configurar VS Code para editar el proyecto. Para esto es necesario tener los siguientes plugins:

1. Remote - SSH
2. Remote - SSH: Editing configuration Files

Para abrir una conexión remota tenemos que presionar el shortcut `Shift + Ctrl + P` y buscar `Remote SSH: Connect to host` y seleccionaremos el host de nuestra máquina virtual:

![VS Code remote ssh connect](https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-05-03-virtualizacion-anidada/ssh-connect-remote.webp "VS Code remote ssh connect")

Una vez dentro de nuestra máquina lo único que tendremos que hacer es abrir la carpeta de nuestro proyecto:

![VS Code remote abrir carpeta](https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-05-03-virtualizacion-anidada/abrir-carpeta-vscode.webp "VS Code remote abrir carpeta")

Listo, ya podemos modificar el código e incluso abrir una terminal integrada para trabajar con los comandos de Artisan o Sail:

![VS Code funcionando](https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-05-03-virtualizacion-anidada/vscode-funcionando.webp "VS Code funcionando")

Para apagar la máquina virtual sólo debes ejecutar el comando:

```powershell
vagrant halt
```

# Conclusiónes

Como lo comentaba al inicio, esta es otra alternativa para usar Linux en Windows. A mi parecer esta es la más comoda ya que nos permite levantar máquinas virtuales de forma ágil y rápida. Si tuvieramos un error en la máquina virtual lo único que tendríamos que hacer es destruirla y volver a iniciarla gracias al provisionamiento. Esto antepone una gran ventaja sobre WSL o Dual Boot. También cabe mencionar que para utilizar estas herramientas es necesario tener una buena computadora por el alto consumo de memoria RAM y uso de procesador.

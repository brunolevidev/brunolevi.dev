---
title: "Provisionamiento automatizado de servidores"
date: 2021-07-16
draft: false

subtitle: "Digital Ocean + Ansible = 💪🤙👌"
description: "En esta guía mostraré como automatizar el provisionamiento de tus servidores con Ansible, en esta ocasión intentaremos con la creación de un una instancia que pueda correr un entorno LEMP sobre Ubuntu 18.04 LTS"
categories: ["Automatización", "Digital Ocean", "Ansible", "Nginx"]
tags: ["Automatización", "Digital Ocean", "Ansible", "Nginx", "Virtualización"]
images: ["https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-07-16-provisionamiento-automatizado-de-servidores/banner.webp"]

---


# Introducción

De acuerdo con (Red Hat, 2021) Ansible es un motor open source que automatiza los procesos para preparar y gestionar la configuración, implementar las aplicaciones y organizarlas, entre otros procedimientos de TI.

Con la automatización que ofrece Ansible, puede instalar sistemas de software, automatizar las tareas diarias, preparar la infraestructura, mejorar la seguridad y el cumplimiento, ejecutar parches en los sistemas y compartir la automatización en toda la empresa.

Ansible se conecta a los nodos y les inserta pequeños programas denominados módulos, los cuales permiten llevar a cabo tareas de automatización en la plataforma.

Esta ejecuta esos programas, los cuales funcionan como modelos de recursos del estado deseado de los sistemas, y, luego, los retira cuando finaliza la tarea.

En esta pequeña guía te enseñaré un ejemplo práctico de cómo crear un entorno LEMP sobre Ubuntu 18.04 LTS para tus proyectos PHP.

# Requisitos

- Contar con un servidor Linux con acceso vía SSH
- Instalar Ansible en tu máquina nodo, es decir, la computadora donde vas a controlar tus servidores, [puedes ver esta guía de instalación](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html)

# Configuración inicial

Vamos a realizar el ritual previo a la automatización de nuestros servidores.

## Creación del droplet en Digital Ocean

Este paso es muy sencillo, pueden usar el droplet de $5.00usd para este ejemplo.

![Vista del dashboard del droplet creado](https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-07-16-provisionamiento-automatizado-de-servidores/creacion-droplet.webp "Vista del dashboard del droplet creado")

Asegurarse de tener acceso por medio de SSH.
![Probando acceso SSH](https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-07-16-provisionamiento-automatizado-de-servidores/acceso-ssh.webp "Probando acceso SSH")

## Configuración del archivo hosts

Ahora tendremos que agregar la ip o dominio de nuestro servidor al archivo hosts que se encuentra en `/etc/ansible/hosts` y vamos a editarlo para que quede de la siguiente forma:

```ruby
# Este es el nombre de grupo de servidores puedes poner lo que quieras
[servers]
# Aquí van los datos de cada uno de tus servidores
# <nombre del servidor> ansible_user=<usuario de tu servidor> domain_name=<tu nombre de dominio> ansible_hsot=<la ip de tu servidor>
server1 ansible_user=root domain_name=demo.brunovelazquez.com ansible_host=143.198.245.243

# Aquí van las configuraciones el interprete de Python, es importante que lo agregues como Python3
[all:vars]
ansible_python_interpreter=/usr/bin/python3
```

## Prueba de que ansible está funcionando

Ahora ejecutaremos el siguiente comando de prueba para verificar que todo está bien en nuestro server.

```bash
ansible all -m ping -u root
```

Lo que hace este comando es hacer ping al servidor por medio de la conexión SSH, si es exitoso tendremos la siguiente salida:

![Probando acceso SSH](https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-07-16-provisionamiento-automatizado-de-servidores/probando-ansible-1.webp "Probando acceso SSH")

Ejecutaremos otro comando sólo para confirmar.

```bash
ansible all -a "ls -las" -u root
```

Lo que hace este comando es simplemente listar el directorio raíz de nuestro servidor y de resultar ok, tendremos la siguiente salida:

![Probando acceso SSH](https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-07-16-provisionamiento-automatizado-de-servidores/probando-ansible-2.webp "Probando acceso SSH")

## Primer playbook

En Ansible tenemos algo que se llaman playbooks, son archivos de configuración que nos permiten agrupar tareas que se ejecutarán de forma secuencial dentro de nuestro servidor, existe una gran cantidad de módulos para ejecutar estas tareas.

En nuestra máquina nodo crearemos un directorio para guardar lo necesario para configurar el primer playbook.

```bash
mkdir ansible-playbooks
cd ansible-palybooks
```

Crearemos un archivo `playbook.yml` que será nuestro punto de entrada para Ansible. Asimismo este archivo llevará la siguiente información:

```bash
touch playbook.yml
```

```yml
---
- hosts: all
    become: true
    vars_files:
        - vars/default.yml

    tasks:
        - name: Install Prerequisites
        apt: name=aptitude update_cache=yes state=latest force_apt_get=yes

        # Sudo Group Setup
        - name: Make sure we have a 'wheel' group
        group:
            name: wheel
            state: present

        # Allow 'wheel' group to have passwordless sudo
        - name: Allow 'wheel' group to have passwordless sudo
        lineinfile:
            path: /etc/sudoers
            state: present
            regexp: '^%wheel'
            line: '%wheel ALL=(ALL) NOPASSWD: ALL'
            validate: '/usr/sbin/visudo -cf %s'

        # User + Key Setup
        - name: Create a new regular user with sudo privileges
        user:
            name: "{{ create_user }}"
            state: present
            groups: wheel
            append: true
            create_home: true
            shell: /bin/bash

        # Set authorized key for remote user
        - name: Set authorized key for remote user
        authorized_key:
            user: "{{ create_user }}"
            state: present
            key: "{{ copy_local_key }}"

        # Disable password authentication for root
        - name: Disable password authentication for root
        lineinfile:
            path: /etc/ssh/sshd_config
            state: present
            regexp: '^#?PermitRootLogin'
            line: 'PermitRootLogin prohibit-password'

        # Install Packages
        - name: Update apt
        apt: update_cache=yes

        - name: Install required system packages
        apt: name={{ sys_packages }} state=latest

        # Create project dir
        - name: Creates directory
        file:
            path: /var/www/{{ http_host }}
            state: directory

        # Nginx Configuration
        - name: Sets Nginx conf file
        template:
            src: "files/nginx.conf.j2"
            dest: "/etc/nginx/sites-available/{{ http_conf }}"

        # Enables new site
        - name: Enables new site
        file:
            src: "/etc/nginx/sites-available/{{ http_conf }}"
            dest: "/etc/nginx/sites-enabled/{{ http_conf }}"
            state: link
        notify: Reload Nginx

        # Removes "default" site    
        - name: Removes "default" site
        file:
            path: "/etc/nginx/sites-enabled/default"
            state: absent
        notify: Reload Nginx

        # MySQL Configuration
        - name: Sets the root password 
        mysql_user: 
            name: root 
            password: "{{ mysql_root_password }}"
            login_user: root
            login_password: "{{mysql_root_password}}"
            host: localhost
            login_unix_socket: /var/run/mysqld/mysqld.sock
            priv: '*.*:ALL,GRANT'
            check_implicit_admin: true 
            state: present

        # Removes all anonymous user accounts
        - name: Removes all anonymous user accounts
        mysql_user:
            name: ''
            host_all: yes
            state: absent
            login_user: root
            login_password: "{{ mysql_root_password }}"

        # Removes the MySQL test database
        - name: Removes the MySQL test database
        mysql_db: 
            name: test 
            state: absent
            login_user: root
            login_password: "{{ mysql_root_password }}"

        # UFW Setup
        - name: UFW - Allow SSH connections
        ufw:
            rule: allow
            name: OpenSSH

        # "UFW - Allow HTTP on port {{ http_port }}"
        - name: "UFW - Allow HTTP on port {{ http_port }}"
        ufw:
            rule: allow
            port: "{{ http_port }}"
            proto: tcp

        # Sets Up PHP Info Page
        - name: Sets Up PHP Info Page
        template:
            src: "files/info.php.j2"
            dest: "/var/www/{{ http_conf }}/info.php"

    handlers:
        - name: Reload Nginx
            service:
            name: nginx
            state: reloaded

        - name: Restart Nginx
            service:
            name: nginx
            state: restarted
```

Crearemos un directorio llamado `files` donde guardaremos nuestras plantillas. Dentro de este directorio crearemos los siguientes archivos: `nginx.conf.j2` y `ìnfo.php.j2`. Es importante mencionar que los tipos de archivo `.j2` corresponden a un motor de plantillas llamado [Jinja2](https://docs.ansible.com/ansible/latest/user_guide/playbooks_templating.html).

```bash
mkdir files
touch nginx.conf.j2
touch info.php.j2
```

Para el archivo `nginx.conf.j2` incluiremos lo siguiente:

```nginx
server {
        # Puerto http que utilizará nginx
        listen {{ http_port }};

        # Directorio del sitio
        root /var/www/{{ http_host }};
        index index.php index.html index.htm index.nginx-debian.html;

        # Dominio el sitio
        server_name {{ http_host }};

        # Pretty url's para wordpress
        location / {
                try_files $uri $uri/ /index.php?$args;
        }
        
        # Configuración para php-fpm
        location ~ \.php$ {
                include snippets/fastcgi-php.conf;
                fastcgi_pass unix:/var/run/php/php7.2-fpm.sock;
        }

        location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
                expires max;
                log_not_found off;
        }

        location = /robots.txt {
                allow all;
                log_not_found off;
                access_log off;
        }

        location = /favicon.ico {
                log_not_found off;
                access_log off;
        }   
             
        location ~ /\.ht {
                deny all;
        }
}
```

Y para el archivo `info.php.j2` será el siguiente código:

```php
<?php
phpinfo();
```

Crearemos un directorio llamado `vars`.

```bash
mkdir vars
```

Dentro de este directorio crearemos nuestro archivo `default.yml` el cual almacenará nuestras variables.

```yml
---
# Nombre del usuario no-root para el servidor
create_user: bruno
copy_local_key: "{% raw %}{{ lookup('file', lookup('env','HOME') + '/.ssh/id_rsa.pub') }}{% endraw %}"
# Paquetes que serán instalados, al utilizar Ubuntu 18.04 LTS serán los mismos que están en apt
sys_packages: [
  'curl', 
  'vim', 
  'git', 
  'ufw', 
  'build-essential', 
  'gcc', 
  'g++', 
  'make', 
  'libc6', 
  'subversion', 
  'cvs', 
  'mercurial',
  'software-properties-common',
  'curl',
  'wget',
  'htop',
  'ntp',
  'nmap',
  'net-tools',
  'nginx',
  'mysql-server',
  'python3-pymysql',
  'php-fpm',
  'php-mysql'
  ]
# Contraseña para el usuario root de mysql
mysql_root_password: "ijWlYWus870k"
# Nombre del dominio
http_host: "demo.brunovelazquez.com"
# Nombre del archivo de configuración para el sitio de nginx
http_conf: "demo.brunovelazquez.com.conf"
# Puerto que utilizará nginx para las peticiones http
http_port: "80"
```

## Ejecución del playbook

Ya tenemos todo listo para provisionar el servidor que acabamos de crear, por lo tanto, es hora de correr el siguiente comando.

```bash
ansible-playbook playbook.yml -l server1 -u root
```

Y si todo va bien, tenemos que concluir con esta salida.

![Ejecutando playbook](https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-07-16-provisionamiento-automatizado-de-servidores/probando-playbook.webp "Ejecutando playbook")

Ahora vamos a verificar nuestro dominio, en mi caso `demo.brunovelazquez.com`.

![Visitando la página](https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/2021-07-16-provisionamiento-automatizado-de-servidores/visitando-dominio.webp "Visitando la página")

# Conclusiónes

De esta forma hemos automatizado el proceso de provisionamiento de nuestro servidor, minimizando las tareas manuales que podrían convertirse en problemas a futuro por errores humanos en la configuración.

Sin duda Ansible es una herramienta muy poderosa que como ingenieros de software nos hace muy productivos a la hora de configurar nuestros servidores, es importante mantenerse actualizado ya que los módulos van cambiando conforme van escalando las versiones. Espero les sirva y hayan aprendido algo.

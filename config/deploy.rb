set :application, "usher"
set :host, "usher.host.com"
set :user, "ubuntu"
set :admin_runner, user
ssh_options[:keys] = ["/path/to/key.pub"]
set :node_file, "app.js"

set :scm, :git
set :branch, "master"
set :repository,  "git@github.com:howardr/usher.git"
default_run_options[:pty] = true

set :deploy_via, :remote_cache
role :app, host
set :deploy_to, "/home/ubuntu/#{application}"
set :use_sudo, true


namespace :deploy do

  task :finalize_update do
    #don't need to do this stuff
  end

  task :symlink do
    # copied from source, but with "sudo" infront of commands (eeeks! this is just a prototype)
    on_rollback do
      if previous_release
        run "sudo rm -f #{current_path}; sudo ln -s #{previous_release} #{current_path}; true"
      else
        logger.important "no previous release to rollback to, rollback of symlink skipped"
      end
    end

    run "sudo rm -f #{current_path} && sudo ln -s #{latest_release} #{current_path}"
  end

  task :start, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo :as => 'root'} start #{application}"
  end

  task :stop, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo :as => 'root'} stop #{application}"
  end

  task :restart, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo :as => 'root'} restart #{application} || #{try_sudo :as => 'root'} start #{application}"
  end

  task :create_deploy_to_with_sudo, :roles => :app do
    run "#{try_sudo :as => 'root'} mkdir -p #{deploy_to}"
    run "#{try_sudo :as => 'root'} chown #{admin_runner}:#{admin_runner} #{deploy_to}"
  end

  task :write_upstart_script, :roles => :app do
    upstart_script = <<-UPSTART
  description "#{application}"

  start on startup
  stop on shutdown

  script
      # We found $HOME is needed. Without it, we ran into problems
      export HOME="/home/#{admin_runner}"

      cd #{current_path}
      exec sudo -u #{admin_runner} sh -c "/usr/local/bin/node #{current_path}/#{node_file} >> #{shared_path}/log/#{application}.log 2>&1"
  end script
  respawn
UPSTART
  put upstart_script, "/tmp/#{application}_upstart.conf"
    run "#{try_sudo :as => 'root'} mv /tmp/#{application}_upstart.conf /etc/init/#{application}.conf"
  end
end

#before 'deploy:setup', 'deploy:create_deploy_to_with_sudo'
after 'deploy:setup', 'deploy:write_upstart_script'

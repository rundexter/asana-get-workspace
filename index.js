var   _ = require('lodash')
  , req = require('superagent')
  , q   = require('q')
;

module.exports = {

    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var credentials = dexter.provider('asana').credentials('access_token')
          , names       = step.input('filter_name').toArray()
          , self        = this
        ;

        //normalize
        names = _.map(names, function(name) { return name.toLowerCase(); });

        var request = req.get('https://app.asana.com/api/1.0/workspaces')
                         .set('Authorization', 'Bearer '+credentials)
                         .type('json')
                     ;

        promisify(request, 'end', 'body.data')
           .then(function(workspaces) {
               if(names.length) {
                   self.complete( _.filter(workspaces, function(workspace) { return names.indexOf(workspace.name.toLowerCase()) !== -1; }) );
               } else {
                   self.complete(workspaces);
               }
           })
           .catch(this.fail.bind(this));

    }
};

function promisify(scope, call, path) {
    var deferred = q.defer(); 

    scope[call](function(err, result) {
        return err
          ? deferred.reject(err)
          : deferred.resolve(_.get(result, path))
        ;
    });

    return deferred.promise;
}


